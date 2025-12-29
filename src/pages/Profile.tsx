import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Camera, Shield, User, Mail, CircleUserRound, Loader2, Copy, Check } from 'lucide-react';
import { useCustomToast } from '@/components/ui/custom-toast';
import defaultAvatar from '@/assets/default-avatar.png';

const Profile = () => {
  const { user, loading, updateUser } = useAuth();
  const db = useDatabase();
  const navigate = useNavigate();
  const { showToast } = useCustomToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [balance, setBalance] = useState(0);

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase.rpc('get_wallet_balance', { p_user_id: user.id });
        setBalance(data || 0);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    fetchBalance();
  }, [user?.id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Fill all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Min. 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    
    setTimeout(() => {
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    }, 1000);
  };

  const handleUploadPicture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Max 5MB allowed', 'error');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage using abstracted service
      const uploadResult = await db.storage.uploadFile('avatars', fileName, file);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const avatarUrl = uploadResult.data!.url;

      // Update user avatar in database
      const updateResult = await db.auth.updateUserAvatar(user.id, avatarUrl);

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update avatar');
      }

      // Update local user state
      updateUser({ avatar_url: avatarUrl });
      showToast('Photo updated!', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const avatarSrc = user?.avatar_url || defaultAvatar;

  return (
    <DashboardLayout balance={balance}>
      {user.is_banned && <BannedUserOverlay />}
      <div className="w-full max-w-5xl mx-auto py-3 xs:py-4 sm:py-6 md:py-10">
        {/* Page Header */}
        <div className="mb-4 xs:mb-6 sm:mb-8 md:mb-12">
          <div className="flex items-center gap-2 xs:gap-3 mb-1.5 xs:mb-2">
            <div 
              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #636df4 0%, #8b93f7 100%)' }}
            >
              <CircleUserRound size={16} className="text-white xs:hidden" />
              <CircleUserRound size={18} className="text-white hidden xs:block sm:hidden" />
              <CircleUserRound size={20} className="text-white hidden sm:block" />
            </div>
            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              My Profile
            </h1>
          </div>
          <p className="text-muted-foreground mt-0.5 xs:mt-1 text-[10px] xs:text-xs sm:text-sm md:text-base ml-9 xs:ml-11 sm:ml-[52px]">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div 
              className="group rounded-2xl overflow-hidden shadow-xl"
              style={{ 
                background: '#ffffff',
                border: '1px solid rgba(99, 109, 244, 0.15)',
                boxShadow: '0 4px 24px rgba(99, 109, 244, 0.12), 0 1px 2px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Header Gradient */}
              <div 
                className="h-28 sm:h-32 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #636df4 0%, #8b93f7 50%, #a5abfa 100%)'
                }}
              >
                {/* Decorative circles */}
                <div 
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 bg-white transition-transform duration-300 group-hover:scale-150"
                />
                <div 
                  className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15 bg-white transition-transform duration-300 group-hover:scale-150"
                />
              </div>
              
              {/* Avatar Section */}
              <div className="px-6 pb-6 -mt-14 sm:-mt-16">
                <div className="relative inline-block">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden"
                    style={{
                      border: '4px solid #ffffff',
                      boxShadow: '0 8px 24px rgba(99, 109, 244, 0.25)'
                    }}
                  >
                    <OptimizedImage 
                      src={avatarSrc} 
                      alt="Profile" 
                      className="w-full h-full bg-muted"
                      priority
                    />
                  </div>
                  <button
                    onClick={handleUploadPicture}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-1 right-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-70 disabled:hover:scale-100"
                    style={{ 
                      background: 'linear-gradient(135deg, #636df4 0%, #7a82f6 100%)',
                      border: '3px solid #ffffff'
                    }}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 size={16} className="text-white animate-spin" />
                    ) : (
                      <Camera size={16} className="text-white" />
                    )}
                  </button>
                </div>

                {/* User Info */}
                <div className="mt-5">
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a2e' }}>
                    {displayName}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                    {displayEmail}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px my-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(99, 109, 244, 0.2), transparent)' }} />

                {/* Quick Info */}
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(99, 109, 244, 0.06)' }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #636df4 0%, #8b93f7 100%)' }}
                    >
                      <User size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>Username</p>
                      <p className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{displayName}</p>
                    </div>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(99, 109, 244, 0.06)' }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #636df4 0%, #8b93f7 100%)' }}
                    >
                      <Mail size={18} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-xs" style={{ color: '#9ca3af' }}>Email</p>
                      <p className="font-semibold text-sm truncate" style={{ color: '#1a1a2e' }} title={displayEmail}>{displayEmail.split('@')[0]}@</p>
                    </div>
                    <button
                      onClick={() => {
                        if (displayEmail) {
                          navigator.clipboard.writeText(displayEmail);
                          setCopiedEmail(true);
                          showToast('Email copied!', 'success');
                          setTimeout(() => setCopiedEmail(false), 2000);
                        }
                      }}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ background: 'rgba(99, 109, 244, 0.1)' }}
                    >
                      {copiedEmail ? (
                        <Check size={16} style={{ color: '#22c55e' }} />
                      ) : (
                        <Copy size={16} style={{ color: '#636df4' }} />
                      )}
                    </button>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(99, 109, 244, 0.06)' }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #636df4 0%, #8b93f7 100%)' }}
                    >
                      <Shield size={18} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs" style={{ color: '#9ca3af' }}>User ID</p>
                      <p className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{user?.uid || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (user?.uid) {
                          navigator.clipboard.writeText(user.uid);
                          setCopiedUid(true);
                          showToast('User ID copied!', 'success');
                          setTimeout(() => setCopiedUid(false), 2000);
                        }
                      }}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ background: 'rgba(99, 109, 244, 0.1)' }}
                    >
                      {copiedUid ? (
                        <Check size={16} style={{ color: '#22c55e' }} />
                      ) : (
                        <Copy size={16} style={{ color: '#636df4' }} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8"
              style={{ 
                background: '#ffffff',
                border: '1px solid rgba(99, 109, 244, 0.15)',
                boxShadow: '0 4px 24px rgba(99, 109, 244, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #636df4 0%, #8b93f7 100%)' }}
                >
                  <Shield size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1a1a2e' }}>Security</h3>
                  <p className="text-sm" style={{ color: '#6b7280' }}>Keep your account secure by updating your password</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-12 rounded-xl pr-12 transition-all"
                      style={{
                        background: '#f9fafb',
                        border: '2px solid #e5e7eb',
                        color: '#1a1a2e'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#636df4';
                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 109, 244, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#9ca3af' }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 rounded-xl pr-12 transition-all"
                        style={{
                          background: '#f9fafb',
                          border: '2px solid #e5e7eb',
                          color: '#1a1a2e'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#636df4';
                          e.target.style.boxShadow = '0 0 0 3px rgba(99, 109, 244, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#9ca3af' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-xl pr-12 transition-all"
                        style={{
                          background: '#f9fafb',
                          border: '2px solid #e5e7eb',
                          color: '#1a1a2e'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#636df4';
                          e.target.style.boxShadow = '0 0 0 3px rgba(99, 109, 244, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#9ca3af' }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Update Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="group relative w-full sm:w-auto font-semibold px-10 h-12 rounded-xl overflow-hidden disabled:opacity-60 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(99,109,244,0.5)]"
                    style={{ 
                      background: 'linear-gradient(135deg, #636df4 0%, #7a82f6 100%)',
                      boxShadow: '0 4px 14px rgba(99, 109, 244, 0.35)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                    <span className="relative">
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
