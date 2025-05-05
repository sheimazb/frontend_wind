import { environment } from '../../environments/environment';

// WebSocket endpoint using ws protocol
export const WEBSOCKET_ENDPOINT = environment.WS_BASE_URL;

// Global notification topic
export const WEBSOCKET_NOTIFY_TOPIC = '/topic/notifications';

// User-specific notification topic format (will be used with interpolation)
export const WEBSOCKET_USER_NOTIFY_TOPIC = '/user/{email}/topic/notifications';