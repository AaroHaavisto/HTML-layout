import React from 'https://esm.sh/react@18.3.1';
import {createRoot} from 'https://esm.sh/react-dom@18.3.1/client';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'https://esm.sh/react-leaflet@4.2.1';
import L from 'https://esm.sh/leaflet@1.9.4';

const h = React.createElement;

const DEFAULT_CENTER = [60.1699, 24.9384]; // Helsinki
const DEFAULT_ZOOM = 10;

let root = null;
let currentContainer = null;
let latestPayload = {
  restaurants: [],
  selectedRestaurantId: null,
  nearestRestaurantId: null,
  onSelectRestaurant: () => {},
};

function toNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeLatLng(rawLat, rawLng) {
  const lat = toNumber(rawLat);
  const lng = toNumber(rawLng);

  if (lat === null || lng === null) {
    return null;
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return [lat, lng];
}

function coordinatesFromArray(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const first = toNumber(coordinates[0]);
  const second = toNumber(coordinates[1]);
  if (first === null || second === null) {
    return null;
  }

  // API coordinates are commonly [lng, lat].
  const asLngLat = normalizeLatLng(second, first);
  if (asLngLat) {
    return asLngLat;
  }

  return normalizeLatLng(first, second);
}

function getRestaurantCoordinates(restaurant) {
  const direct = normalizeLatLng(restaurant?.latitude, restaurant?.longitude);
  if (direct) {
    return direct;
  }

  const wgs84 = normalizeLatLng(restaurant?.wgs84_lat, restaurant?.wgs84_lng);
  if (wgs84) {
    return wgs84;
  }

  const locationObject = restaurant?.location || {};

  const nested = normalizeLatLng(locationObject.lat, locationObject.lng);
  if (nested) {
    return nested;
  }

  const nestedAlt = normalizeLatLng(
    locationObject.latitude,
    locationObject.longitude
  );
  if (nestedAlt) {
    return nestedAlt;
  }

  return coordinatesFromArray(locationObject.coordinates);
}

function getRestaurantId(restaurant) {
  return restaurant._id || restaurant.id || restaurant.restaurantId || '';
}

function getRestaurantName(restaurant) {
  return restaurant.name || 'Nimeton ravintola';
}

function getRestaurantAddress(restaurant) {
  const parts = [
    restaurant.address,
    restaurant.postalCode,
    restaurant.city,
  ].filter(Boolean);
  return parts.join(', ');
}

function createPinIcon(isSelected, isNearest) {
  const nearestClass = isNearest ? ' is-nearest' : '';
  const selectedClass = isSelected ? ' is-selected' : '';

  return L.divIcon({
    className: '',
    html: `<div class="map-pin${nearestClass}${selectedClass}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function FitToVisibleMarkers({positions, positionsKey}) {
  const map = useMap();

  React.useEffect(() => {
    if (!positions.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, {padding: [35, 35]});
  }, [map, positions, positionsKey]);

  return null;
}

function FocusSelectedRestaurant({position}) {
  const map = useMap();

  React.useEffect(() => {
    if (!position) {
      return;
    }

    map.flyTo(position, Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.4,
    });
  }, [map, position]);

  return null;
}

function RestaurantsMap({
  restaurants,
  selectedRestaurantId,
  nearestRestaurantId,
  onSelectRestaurant,
}) {
  const markerRefs = React.useRef(new Map());

  const markerItems = restaurants
    .map(restaurant => {
      const position = getRestaurantCoordinates(restaurant);
      if (!position) {
        return null;
      }

      const restaurantId = getRestaurantId(restaurant);
      return {
        id: restaurantId,
        name: getRestaurantName(restaurant),
        address: getRestaurantAddress(restaurant),
        position,
      };
    })
    .filter(Boolean);

  const positions = markerItems.map(item => item.position);
  const positionsKey = positions
    .map(position => `${position[0].toFixed(6)}:${position[1].toFixed(6)}`)
    .join('|');
  const selectedMarker = markerItems.find(
    item => item.id === selectedRestaurantId
  );

  React.useEffect(() => {
    if (!selectedMarker) {
      return;
    }

    const markerInstance = markerRefs.current.get(selectedMarker.id);
    markerInstance?.openPopup();
  }, [selectedMarker]);

  if (!markerItems.length) {
    return h(
      'div',
      {className: 'map-empty-state'},
      'Valituilla ravintoloilla ei ole sijaintitietoja karttaa varten.'
    );
  }

  return h(
    MapContainer,
    {center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, scrollWheelZoom: true},
    h(TileLayer, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    }),
    markerItems.map(item =>
      h(
        Marker,
        {
          key: item.id,
          position: item.position,
          icon: createPinIcon(
            item.id === selectedRestaurantId,
            item.id === nearestRestaurantId
          ),
          ref: marker => {
            if (marker) {
              markerRefs.current.set(item.id, marker);
            } else {
              markerRefs.current.delete(item.id);
            }
          },
          eventHandlers: {
            click: () => onSelectRestaurant(item.id),
          },
        },
        h(
          Popup,
          null,
          h('strong', null, item.name),
          item.address ? h('div', null, item.address) : null
        )
      )
    ),
    h(FitToVisibleMarkers, {positions, positionsKey}),
    h(FocusSelectedRestaurant, {
      position: selectedMarker ? selectedMarker.position : null,
    })
  );
}

function render() {
  if (!root || !currentContainer) {
    return;
  }

  root.render(
    h(RestaurantsMap, {
      restaurants: latestPayload.restaurants,
      selectedRestaurantId: latestPayload.selectedRestaurantId,
      nearestRestaurantId: latestPayload.nearestRestaurantId,
      onSelectRestaurant: latestPayload.onSelectRestaurant,
    })
  );
}

export function mountRestaurantsMap(containerElement) {
  if (!containerElement || root) {
    return;
  }

  currentContainer = containerElement;
  root = createRoot(containerElement);
  render();
}

export function updateRestaurantsMap({
  restaurants = [],
  selectedRestaurantId = null,
  nearestRestaurantId = null,
  onSelectRestaurant,
}) {
  latestPayload = {
    restaurants,
    selectedRestaurantId,
    nearestRestaurantId,
    onSelectRestaurant:
      typeof onSelectRestaurant === 'function' ? onSelectRestaurant : () => {},
  };

  render();
}
