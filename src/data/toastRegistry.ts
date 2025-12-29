// Registry of all toast messages in the application
// Each toast can be individually enabled/disabled by admin

export interface ToastEntry {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  category: string;
  description: string;
}

export const toastRegistry: ToastEntry[] = [
  // ==================== AUTHENTICATION ====================
  { id: 'login_success', message: 'Login successful!', type: 'success', category: 'Authentication', description: 'When user logs in successfully' },
  { id: 'login_loading', message: 'Logging in...', type: 'loading', category: 'Authentication', description: 'While login is processing' },
  { id: 'login_failed', message: 'Invalid credentials', type: 'error', category: 'Authentication', description: 'When login fails' },
  { id: 'login_captcha', message: 'Verify captcha', type: 'error', category: 'Authentication', description: 'When captcha not verified' },
  { id: 'google_login_failed', message: 'Google login failed', type: 'error', category: 'Authentication', description: 'When Google sign-in fails' },
  { id: 'logout_success', message: 'Logged out', type: 'success', category: 'Authentication', description: 'When user logs out' },
  
  // ==================== REGISTRATION ====================
  { id: 'register_creating', message: 'Creating...', type: 'info', category: 'Registration', description: 'While account is being created' },
  { id: 'register_success', message: 'Account created!', type: 'success', category: 'Registration', description: 'When registration succeeds' },
  { id: 'register_email_exists', message: 'Email already exists', type: 'error', category: 'Registration', description: 'When email is taken' },
  { id: 'register_network_error', message: 'Network error', type: 'error', category: 'Registration', description: 'When network fails during registration' },
  { id: 'register_captcha', message: 'Complete captcha', type: 'error', category: 'Registration', description: 'When captcha not completed' },
  { id: 'register_weak_password', message: 'Use stronger password', type: 'warning', category: 'Registration', description: 'When password is weak' },
  
  // ==================== ACCOUNT / PROFILE ====================
  { id: 'account_banned', message: 'Account suspended. Contact support.', type: 'error', category: 'Account', description: 'When account is banned' },
  { id: 'password_changed', message: 'Password changed successfully', type: 'success', category: 'Account', description: 'When password is updated' },
  { id: 'password_fields_empty', message: 'Fill all fields', type: 'error', category: 'Account', description: 'When password fields empty' },
  { id: 'password_mismatch', message: 'New passwords do not match', type: 'error', category: 'Account', description: 'When passwords dont match' },
  { id: 'password_too_short', message: 'Min. 6 characters', type: 'error', category: 'Account', description: 'When password too short' },
  { id: 'photo_updated', message: 'Photo updated!', type: 'success', category: 'Account', description: 'When avatar is changed' },
  { id: 'photo_invalid_type', message: 'Please select an image file', type: 'error', category: 'Account', description: 'When file is not an image' },
  { id: 'photo_too_large', message: 'Max 5MB allowed', type: 'error', category: 'Account', description: 'When image is too large' },
  { id: 'photo_upload_failed', message: 'Failed to upload image', type: 'error', category: 'Account', description: 'When avatar upload fails' },
  
  // ==================== COPY ACTIONS ====================
  { id: 'email_copied', message: 'Email copied!', type: 'success', category: 'Copy', description: 'When email is copied' },
  { id: 'uid_copied', message: 'User ID copied!', type: 'success', category: 'Copy', description: 'When user ID is copied' },
  { id: 'upi_copied', message: 'UPI ID copied!', type: 'success', category: 'Copy', description: 'When UPI ID is copied' },
  { id: 'referral_copied', message: 'Referral link copied!', type: 'success', category: 'Copy', description: 'When referral link is copied' },
  { id: 'copy_failed', message: 'Failed to copy', type: 'error', category: 'Copy', description: 'When copy fails' },
  { id: 'promo_code_copied', message: 'Copied!', type: 'success', category: 'Copy', description: 'When promo code is copied' },
  
  // ==================== RECHARGE & PAYMENTS ====================
  { id: 'utr_empty', message: 'Enter UTR Number', type: 'error', category: 'Recharge', description: 'When UTR is empty' },
  { id: 'utr_invalid', message: 'Invalid UTR Number', type: 'error', category: 'Recharge', description: 'When UTR is invalid' },
  { id: 'recharge_submitted', message: 'Request submitted! Your balance will be updated shortly.', type: 'success', category: 'Recharge', description: 'When recharge request is sent' },
  
  // ==================== PROMO CODES (User) ====================
  { id: 'promo_empty', message: 'Enter code', type: 'error', category: 'Promo', description: 'When promo code is empty' },
  { id: 'promo_validating', message: 'Validating...', type: 'loading', category: 'Promo', description: 'While promo code is checking' },
  { id: 'promo_success', message: 'added!', type: 'success', category: 'Promo', description: 'When promo code works (shows amount)' },
  { id: 'promo_invalid', message: 'Invalid Code', type: 'error', category: 'Promo', description: 'When promo code is invalid' },
  { id: 'promo_expired', message: 'Code Expired', type: 'error', category: 'Promo', description: 'When promo code is expired' },
  { id: 'promo_already_used', message: 'Already Redeemed', type: 'error', category: 'Promo', description: 'When promo already used' },
  { id: 'promo_limit_reached', message: 'Limit Reached', type: 'error', category: 'Promo', description: 'When max redemptions hit' },
  { id: 'promo_inactive', message: 'Code Inactive', type: 'error', category: 'Promo', description: 'When code is no longer active' },
  { id: 'promo_redeem_failed', message: 'Failed to redeem', type: 'error', category: 'Promo', description: 'When redemption fails' },
  
  // ==================== REFERRAL ====================
  { id: 'referral_generating', message: 'Generating link...', type: 'info', category: 'Referral', description: 'While generating referral link' },
  { id: 'referral_copy_failed', message: 'Failed to copy link', type: 'error', category: 'Referral', description: 'When referral copy fails' },
  { id: 'withdraw_login', message: 'Please login to withdraw', type: 'error', category: 'Referral', description: 'When not logged in for withdraw' },
  { id: 'withdraw_min_amount', message: 'Min. ₹100 required', type: 'error', category: 'Referral', description: 'When balance too low' },
  { id: 'withdraw_processing', message: 'Processing...', type: 'info', category: 'Referral', description: 'While processing withdraw' },
  { id: 'withdraw_loading', message: 'Withdrawing...', type: 'loading', category: 'Referral', description: 'While withdraw is loading' },
  { id: 'withdraw_success', message: 'added!', type: 'success', category: 'Referral', description: 'When withdraw succeeds (shows amount)' },
  { id: 'withdraw_failed', message: 'Withdraw failed', type: 'error', category: 'Referral', description: 'When withdraw fails' },
  { id: 'withdraw_balance_error', message: 'Failed to check balance', type: 'error', category: 'Referral', description: 'When balance check fails' },
  { id: 'withdraw_something_wrong', message: 'Something went wrong', type: 'error', category: 'Referral', description: 'When unknown error occurs' },
  
  // ==================== GET NUMBER / SMS ====================
  { id: 'number_acquired', message: 'Number acquired', type: 'success', category: 'Get Number', description: 'When number is purchased (shows number)' },
  { id: 'number_not_available', message: 'Number not available', type: 'error', category: 'Get Number', description: 'When no number available' },
  { id: 'number_failed', message: 'Failed to get number', type: 'error', category: 'Get Number', description: 'When purchase fails' },
  { id: 'insufficient_balance', message: 'Insufficient balance', type: 'error', category: 'Get Number', description: 'When balance too low for purchase' },
  { id: 'data_load_failed', message: 'Failed to load data', type: 'error', category: 'Get Number', description: 'When services fail to load' },
  { id: 'sms_received', message: 'SMS received!', type: 'success', category: 'Get Number', description: 'When OTP is received' },
  { id: 'next_sms_requested', message: 'Next SMS requested', type: 'success', category: 'Get Number', description: 'When next SMS is requested' },
  { id: 'next_sms_failed', message: 'Failed', type: 'error', category: 'Get Number', description: 'When next SMS request fails' },
  { id: 'number_cancelled', message: 'Number cancelled', type: 'success', category: 'Get Number', description: 'When number is cancelled' },
  { id: 'number_refunded', message: 'Refunded', type: 'success', category: 'Get Number', description: 'When refund is processed (shows amount)' },
  { id: 'number_expired', message: 'Number expired - Refunded', type: 'info', category: 'Get Number', description: 'When number auto-cancels' },
  { id: 'cancel_failed', message: 'Cancel failed', type: 'error', category: 'Get Number', description: 'When cancel fails' },
  { id: 'early_cancel_denied', message: 'Wait 2 min to cancel', type: 'error', category: 'Get Number', description: 'When cancelling too early' },
  { id: 'activation_not_found', message: 'Activation not found', type: 'error', category: 'Get Number', description: 'When activation doesnt exist' },
  { id: 'invalid_api_key', message: 'Invalid API key', type: 'error', category: 'Get Number', description: 'When API key is invalid' },
  { id: 'invalid_action', message: 'Invalid action', type: 'error', category: 'Get Number', description: 'When action is invalid' },
  { id: 'invalid_status', message: 'Invalid status', type: 'error', category: 'Get Number', description: 'When status is invalid' },
  { id: 'number_still_active', message: 'Number still active', type: 'error', category: 'Get Number', description: 'When number cannot be cancelled' },
  { id: 'server_error', message: 'Server error', type: 'error', category: 'Get Number', description: 'When server error occurs' },
  { id: 'new_number_acquired', message: 'New number acquired!', type: 'success', category: 'Get Number', description: 'When getting next number' },
  { id: 'missing_service_info', message: 'Cannot get next number - missing service info', type: 'error', category: 'Get Number', description: 'When service info missing' },
  { id: 'request_failed', message: 'Request failed', type: 'error', category: 'Get Number', description: 'When request fails' },
  
  // ==================== API STATUS TOASTS ====================
  { id: 'api_status_access_number', message: 'API: ACCESS_NUMBER', type: 'info', category: 'API Status', description: 'When API returns ACCESS_NUMBER status' },
  { id: 'api_status_no_number', message: 'API: NO_NUMBER', type: 'warning', category: 'API Status', description: 'When API returns NO_NUMBER status' },
  { id: 'api_status_wait_code', message: 'API: STATUS_WAIT_CODE', type: 'info', category: 'API Status', description: 'When API is waiting for OTP' },
  { id: 'api_status_ok', message: 'API: STATUS_OK', type: 'success', category: 'API Status', description: 'When API returns OTP successfully' },
  { id: 'api_status_cancel', message: 'API: STATUS_CANCEL', type: 'info', category: 'API Status', description: 'When API confirms cancellation' },
  { id: 'api_status_bad_key', message: 'API: BAD_KEY', type: 'error', category: 'API Status', description: 'When API key is invalid' },
  { id: 'api_status_bad_action', message: 'API: BAD_ACTION', type: 'error', category: 'API Status', description: 'When API action is invalid' },
  { id: 'api_status_no_activation', message: 'API: NO_ACTIVATION', type: 'error', category: 'API Status', description: 'When activation not found in API' },
  { id: 'api_status_bad_status', message: 'API: BAD_STATUS', type: 'error', category: 'API Status', description: 'When API returns bad status' },
  { id: 'api_status_wait_retry', message: 'API: STATUS_WAIT_RETRY', type: 'info', category: 'API Status', description: 'When API is waiting for retry' },
  { id: 'api_status_early_cancel', message: 'API: EARLY_CANCEL_DENIED', type: 'warning', category: 'API Status', description: 'When cancel is too early' },
  { id: 'api_status_still_active', message: 'API: STILL_ACTIVE', type: 'info', category: 'API Status', description: 'When number is still active' },
  { id: 'api_status_success', message: 'API: SUCCESS', type: 'success', category: 'API Status', description: 'When API call succeeds' },
  { id: 'api_status_error', message: 'API: ERROR', type: 'error', category: 'API Status', description: 'When API call fails' },
  { id: 'api_status_timeout', message: 'API: TIMEOUT', type: 'error', category: 'API Status', description: 'When API times out' },
  
  // ==================== ADMIN GENERAL ====================
  { id: 'admin_welcome', message: 'Welcome, Admin!', type: 'success', category: 'Admin', description: 'When admin logs in' },
  { id: 'admin_denied', message: 'Admin access denied', type: 'error', category: 'Admin', description: 'When non-admin tries to access' },
  { id: 'admin_logged_in_as_user', message: 'Logged in as user', type: 'success', category: 'Admin', description: 'When admin impersonates user' },
  
  // ==================== ADMIN PROMO CODES ====================
  { id: 'admin_promo_load_failed', message: 'Load failed', type: 'error', category: 'Admin Promo', description: 'When promo codes fail to load' },
  { id: 'admin_promo_copy_failed', message: 'Copy failed', type: 'error', category: 'Admin Promo', description: 'When promo code copy fails' },
  { id: 'admin_promo_updating', message: 'Updating...', type: 'loading', category: 'Admin Promo', description: 'While toggling promo status' },
  { id: 'admin_promo_activated', message: 'Activated', type: 'success', category: 'Admin Promo', description: 'When promo is activated' },
  { id: 'admin_promo_deactivated', message: 'Deactivated', type: 'success', category: 'Admin Promo', description: 'When promo is deactivated' },
  { id: 'admin_promo_update_failed', message: 'Update failed', type: 'error', category: 'Admin Promo', description: 'When promo update fails' },
  { id: 'admin_promo_enter_code', message: 'Enter code', type: 'error', category: 'Admin Promo', description: 'When promo code is empty' },
  { id: 'admin_promo_min_chars', message: 'Min 8 characters', type: 'error', category: 'Admin Promo', description: 'When code too short' },
  { id: 'admin_promo_max_chars', message: 'Max 14 characters', type: 'error', category: 'Admin Promo', description: 'When code too long' },
  { id: 'admin_promo_enter_amount', message: 'Enter amount', type: 'error', category: 'Admin Promo', description: 'When amount is empty' },
  { id: 'admin_promo_invalid_amount', message: 'Invalid amount', type: 'error', category: 'Admin Promo', description: 'When amount is invalid' },
  { id: 'admin_promo_enter_max_uses', message: 'Enter max uses', type: 'error', category: 'Admin Promo', description: 'When max uses is empty' },
  { id: 'admin_promo_invalid_max_uses', message: 'Invalid max uses', type: 'error', category: 'Admin Promo', description: 'When max uses is invalid' },
  { id: 'admin_promo_creating', message: 'Creating...', type: 'loading', category: 'Admin Promo', description: 'While creating promo' },
  { id: 'admin_promo_created', message: 'Code created!', type: 'success', category: 'Admin Promo', description: 'When promo is created' },
  { id: 'admin_promo_exists', message: 'Code exists', type: 'error', category: 'Admin Promo', description: 'When promo code already exists' },
  { id: 'admin_promo_create_failed', message: 'Create failed', type: 'error', category: 'Admin Promo', description: 'When promo creation fails' },
  { id: 'admin_promo_deleting', message: 'Deleting...', type: 'loading', category: 'Admin Promo', description: 'While deleting promo' },
  { id: 'admin_promo_deleted', message: 'Deleted!', type: 'success', category: 'Admin Promo', description: 'When promo is deleted' },
  { id: 'admin_promo_delete_failed', message: 'Delete failed', type: 'error', category: 'Admin Promo', description: 'When promo deletion fails' },
  { id: 'admin_promo_refreshing', message: 'Refreshing...', type: 'loading', category: 'Admin Promo', description: 'While refreshing list' },
  { id: 'admin_promo_refreshed', message: 'Refreshed!', type: 'success', category: 'Admin Promo', description: 'When list is refreshed' },
  
  // ==================== ADMIN USERS ====================
  { id: 'admin_users_fetch_failed', message: 'Failed to fetch users', type: 'error', category: 'Admin Users', description: 'When users fail to load' },
  { id: 'admin_users_fetch_banned_failed', message: 'Failed to fetch banned users', type: 'error', category: 'Admin Users', description: 'When banned users fail to load' },
  { id: 'admin_user_banned', message: 'User Banned', type: 'success', category: 'Admin Users', description: 'When user is banned' },
  { id: 'admin_user_unbanned', message: 'User Unbanned', type: 'success', category: 'Admin Users', description: 'When user is unbanned' },
  { id: 'admin_ban_failed', message: 'Failed to update ban status', type: 'error', category: 'Admin Users', description: 'When ban/unban fails' },
  { id: 'admin_balance_updated', message: 'Balance updated!', type: 'success', category: 'Admin Users', description: 'When balance is updated' },
  { id: 'admin_balance_update_failed', message: 'Failed to update balance', type: 'error', category: 'Admin Users', description: 'When balance update fails' },
  { id: 'admin_password_reset', message: 'Password reset!', type: 'success', category: 'Admin Users', description: 'When password is reset' },
  { id: 'admin_password_min_chars', message: 'Min 6 characters', type: 'error', category: 'Admin Users', description: 'When password too short' },
  { id: 'admin_password_reset_failed', message: 'Failed to reset password', type: 'error', category: 'Admin Users', description: 'When password reset fails' },
  { id: 'admin_discount_updated', message: 'Discount updated!', type: 'success', category: 'Admin Users', description: 'When discount is updated' },
  { id: 'admin_discount_max_percent', message: 'Max 100%', type: 'error', category: 'Admin Users', description: 'When percentage exceeds 100' },
  { id: 'admin_discount_update_failed', message: 'Failed to update discount', type: 'error', category: 'Admin Users', description: 'When discount update fails' },
  
  // ==================== ADMIN DISCOUNT SETUP ====================
  { id: 'admin_discount_load_failed', message: 'Failed to load users', type: 'error', category: 'Admin Discount', description: 'When users fail to load' },
  { id: 'admin_discount_not_auth', message: 'Not authenticated', type: 'error', category: 'Admin Discount', description: 'When not authenticated' },
  { id: 'admin_discount_invalid_value', message: 'Enter a valid discount value', type: 'error', category: 'Admin Discount', description: 'When discount value invalid' },
  { id: 'admin_discount_max_100', message: 'Percentage cannot exceed 100%', type: 'error', category: 'Admin Discount', description: 'When percentage over 100' },
  { id: 'admin_discount_user_updated', message: 'Discount updated', type: 'success', category: 'Admin Discount', description: 'When user discount updated (shows email)' },
  
  // ==================== ADMIN SERVERS ====================
  { id: 'admin_server_login_required', message: 'You must be logged in', type: 'error', category: 'Admin Servers', description: 'When not logged in' },
  { id: 'admin_server_name_required', message: 'Server name is required', type: 'error', category: 'Admin Servers', description: 'When server name empty' },
  { id: 'admin_server_country_required', message: 'Please select a country', type: 'error', category: 'Admin Servers', description: 'When country not selected' },
  { id: 'admin_server_url_required', message: 'API Get Number URL is required', type: 'error', category: 'Admin Servers', description: 'When API URL empty' },
  { id: 'admin_server_added', message: 'Server added successfully', type: 'success', category: 'Admin Servers', description: 'When server is added (shows name)' },
  { id: 'admin_server_add_failed', message: 'Failed to add server', type: 'error', category: 'Admin Servers', description: 'When server add fails' },
  { id: 'admin_server_complete_step1', message: 'Complete Server Info First', type: 'error', category: 'Admin Servers', description: 'When step 1 incomplete' },
  { id: 'admin_server_complete_step2', message: 'Complete API Setup First', type: 'error', category: 'Admin Servers', description: 'When step 2 incomplete' },
  
  // ==================== ADMIN SERVICES ====================
  { id: 'admin_service_no_matches', message: 'No matches found', type: 'info', category: 'Admin Services', description: 'When no service matches found' },
  { id: 'admin_service_enter_manually', message: 'Enter details manually', type: 'info', category: 'Admin Services', description: 'When manual entry needed' },
  { id: 'admin_service_fetch_failed', message: 'Failed to fetch services', type: 'error', category: 'Admin Services', description: 'When services fail to load' },
  { id: 'admin_service_selected', message: 'Selected', type: 'success', category: 'Admin Services', description: 'When service is selected (shows name/price)' },
  { id: 'admin_service_set_price_manually', message: 'Set price manually', type: 'info', category: 'Admin Services', description: 'When price needs manual entry' },
  { id: 'admin_service_manual_entry', message: 'Enter service details manually', type: 'info', category: 'Admin Services', description: 'When using manual entry' },
  
  // ==================== GENERAL / SYSTEM ====================
  { id: 'login_required', message: 'Login required', type: 'error', category: 'General', description: 'When action needs login' },
  { id: 'connection_error', message: 'Check connection', type: 'error', category: 'General', description: 'When network issue occurs' },
  { id: 'error_generic', message: 'Error', type: 'error', category: 'General', description: 'Generic error message' },
  { id: 'success_generic', message: 'Success', type: 'success', category: 'General', description: 'Generic success message' },
  { id: 'loading_generic', message: 'Loading...', type: 'loading', category: 'General', description: 'Generic loading message' },
];

// Get all unique categories
export const toastCategories = [...new Set(toastRegistry.map(t => t.category))];

// Storage key for disabled toasts
export const DISABLED_TOASTS_KEY = 'disabled-toasts';

// Get disabled toasts from localStorage
export const getDisabledToasts = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DISABLED_TOASTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

// Save disabled toasts to localStorage
export const setDisabledToasts = (disabledIds: string[]) => {
  localStorage.setItem(DISABLED_TOASTS_KEY, JSON.stringify(disabledIds));
};

// Check if a toast is enabled
export const isToastEnabled = (id: string): boolean => {
  const disabled = getDisabledToasts();
  return !disabled.includes(id);
};

// Check if a message matches any registered toast
export const findToastByMessage = (message: string): ToastEntry | undefined => {
  return toastRegistry.find(t => 
    message.toLowerCase().includes(t.message.toLowerCase()) ||
    t.message.toLowerCase().includes(message.toLowerCase())
  );
};
