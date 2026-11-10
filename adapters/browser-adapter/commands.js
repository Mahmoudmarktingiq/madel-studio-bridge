/**
 * MADEL Studio Bridge — Browser Adapter Command Handlers
 * Developed and maintained by Mahmoud Adel
 *
 * Implements command dispatch and action normalization for Chromium automation.
 */

export const BROWSER_COMMANDS = {
  // Management
  LIST_BROWSERS: "browser_list_browsers",
  CREATE_SESSION: "browser_create_session",
  LIST_SESSIONS: "browser_list_sessions",
  CLOSE_SESSION: "browser_close_session",

  // Navigation
  OPEN_URL: "browser_open_url",
  NAVIGATE: "browser_navigate",
  RELOAD_PAGE: "browser_reload_page",
  GO_BACK: "browser_go_back",
  GO_FORWARD: "browser_go_forward",
  GET_CURRENT_URL: "browser_get_current_url",
  GET_PAGE_TITLE: "browser_get_page_title",

  // Page Inspection
  READ_VISIBLE_TEXT: "browser_read_visible_text",
  INSPECT_DOM_ELEMENTS: "browser_inspect_dom_elements",
  FIND_ELEMENTS: "browser_find_elements",
  GET_PAGE_METADATA: "browser_get_page_metadata",
  INSPECT_LINKS: "browser_inspect_links",
  GET_SCREENSHOT: "browser_get_screenshot",

  // Interaction
  CLICK_ELEMENT: "browser_click_element",
  FILL_INPUT: "browser_fill_input",
  SELECT_OPTION: "browser_select_option",
  SCROLL_PAGE: "browser_scroll_page",
  WAIT_FOR_ELEMENT: "browser_wait_for_element",
  UPLOAD_LOCAL_FILE: "browser_upload_local_file",

  // Diagnostics
  INSPECT_CONSOLE_ERRORS: "browser_inspect_console_errors",
  INSPECT_FAILED_NETWORK_REQUESTS: "browser_inspect_failed_network_requests",
  GET_PAGE_PERFORMANCE_METRICS: "browser_get_page_performance_metrics",
  CAPTURE_ACCESSIBILITY_SNAPSHOT: "browser_capture_accessibility_snapshot",
};

export const BROWSER_SCOPES = {
  MANAGEMENT: "browser:session",
  NAVIGATION: "browser:navigation",
  INTERACTION: "browser:interaction",
  DIAGNOSTICS: "browser:diagnostics",
};
