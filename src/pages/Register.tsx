import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '@/hooks/useAuth';
import { useCustomToast } from '@/components/ui/custom-toast';
import { z } from 'zod';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import smsIllustration from '@/assets/sms-illustration.png';
import logo from '@/assets/logo.png';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

// Professional email validation with comprehensive checks
const emailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email must be less than 254 characters')
  .email('Please enter a valid email address')
  .refine((email) => {
    // Check for valid characters and structure
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email);
  }, 'Please enter a valid email format')
  .refine((email) => {
    // Check domain has valid TLD (at least 2 characters)
    const domain = email.split('@')[1];
    if (!domain) return false;
    const tld = domain.split('.').pop();
    return tld && tld.length >= 2;
  }, 'Please enter a valid email domain')
  .refine((email) => {
    // Block obviously fake/disposable patterns
    const blockedPatterns = ['test@test', 'fake@fake', 'example@example'];
    return !blockedPatterns.some(pattern => email.toLowerCase().includes(pattern));
  }, 'Please use a valid email address');

// Common weak passwords list
const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', 'password1', 'admin', 'letmein', 'welcome', 'monkey'];

// Password strength checker
const checkPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
  if (password.length < 6) return { strength: 'weak', message: 'Password is too short' };
  if (commonPasswords.includes(password.toLowerCase())) return { strength: 'weak', message: 'This is a commonly used password' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { strength: 'weak', message: 'Add uppercase, numbers & symbols for a stronger password' };
  if (score <= 3) return { strength: 'medium', message: 'Add more variety for a stronger password' };
  return { strength: 'strong', message: 'Strong password!' };
};

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password must be less than 72 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<{ strength: 'weak' | 'medium' | 'strong'; message: string } | null>(null);
  const [hasShownWeakWarning, setHasShownWeakWarning] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { signUp, user, loading } = useAuth();
  const { showToast } = useCustomToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaVerified(!!token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
      validation.error.errors.forEach(err => {
        const path = err.path[0] as string;
        fieldErrors[path as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!captchaVerified) {
      showToast('Complete captcha', 'error');
      return;
    }

    setIsLoading(true);
    showToast('Creating...', 'info');
    
    try {
      const { error } = await signUp(email, password, name);
      setIsLoading(false);

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('Email already registered')) {
            showToast('Email already exists', 'error');
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.toLowerCase().includes('network')) {
            showToast('Network error', 'error');
          } else {
            showToast(error.message.slice(0, 35), 'error');
          }
        recaptchaRef.current?.reset();
        setCaptchaVerified(false);
      } else {
        showToast('Account created!', 'success');
        navigate('/');
      }
    } catch (err: any) {
      setIsLoading(false);
      showToast('Check connection', 'error');
      recaptchaRef.current?.reset();
      setCaptchaVerified(false);
    }
  };

  if (loading || isLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex animate-fade-in">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col relative">
        {/* Logo */}
        <div className="absolute top-4 xs:top-6 left-4 xs:left-6">
          <OptimizedImage src={logo} alt="Logo" className="w-8 h-8 xs:w-10 xs:h-10" priority />
        </div>

        {/* Form Container - Centered */}
        <div className="flex-1 flex items-center justify-center px-4 xs:px-6 pt-16 xs:pt-20 pb-6">
          <div className="w-full max-w-[480px]">
            {/* Heading */}
            <h4 className="text-[28px] font-semibold text-[#1a1a2e] mb-1">
              Register
            </h4>
            <p className="text-sm text-[#666] mb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[rgb(99,102,241)] hover:underline font-medium">
                Log in
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full h-[52px] px-4 rounded-md border ${errors.name ? 'border-red-400' : 'border-[#e5e7eb]'} bg-white text-[#1a1a2e] placeholder-[#9ca3af] text-sm focus:outline-none focus:border-[#6B5BF7] transition-colors`}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full h-[52px] px-4 rounded-md border ${errors.email ? 'border-red-400' : 'border-[#e5e7eb]'} bg-white text-[#1a1a2e] placeholder-[#9ca3af] text-sm focus:outline-none focus:border-[#6B5BF7] transition-colors`}
                  disabled={isLoading}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    setPassword(newPassword);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    
                    // Check password strength
                    if (newPassword.length > 0) {
                      const strength = checkPasswordStrength(newPassword);
                      setPasswordStrength(strength);
                      
                      // Show toast warning for weak passwords (only once per typing session)
                      if (strength.strength === 'weak' && newPassword.length >= 6 && !hasShownWeakWarning) {
                        showToast('Use stronger password', 'warning');
                        setHasShownWeakWarning(true);
                      }
                    } else {
                      setPasswordStrength(null);
                      setHasShownWeakWarning(false);
                    }
                  }}
                  className={`w-full h-[52px] px-4 rounded-md border ${errors.password ? 'border-red-400' : 'border-[#e5e7eb]'} bg-white text-[#1a1a2e] placeholder-[#9ca3af] text-sm focus:outline-none focus:border-[#6B5BF7] transition-colors`}
                  disabled={isLoading}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                
                {/* Password Strength Indicator */}
                {password.length > 0 && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.strength === 'weak' ? 'w-1/3 bg-red-500' :
                            passwordStrength.strength === 'medium' ? 'w-2/3 bg-yellow-500' :
                            'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength === 'weak' ? 'text-red-500' :
                        passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                        'text-green-500'
                      }`}>
                        {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                      </span>
                    </div>
                    {passwordStrength.strength !== 'strong' && (
                      <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: passwordStrength.strength === 'weak' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)', border: `1px solid ${passwordStrength.strength === 'weak' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)'}` }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={passwordStrength.strength === 'weak' ? '#EF4444' : '#F59E0B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <p className="text-xs" style={{ color: passwordStrength.strength === 'weak' ? '#B91C1C' : '#92400E' }}>
                          {passwordStrength.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  className={`w-full h-[52px] px-4 rounded-md border ${errors.confirmPassword ? 'border-red-400' : 'border-[#e5e7eb]'} bg-white text-[#1a1a2e] placeholder-[#9ca3af] text-sm focus:outline-none focus:border-[#6B5BF7] transition-colors`}
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* reCAPTCHA */}
              <div className="pt-1 flex justify-center overflow-x-auto">
                <div className="transform scale-[0.85] xs:scale-100 origin-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={isLoading || !captchaVerified}
                className="w-full h-[52px] rounded-lg text-white text-base font-semibold bg-gradient-to-r from-[#6B5BF7] to-[#6F6DFE] shadow-[0_6px_18px_rgba(107,91,247,0.18)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(107,91,247,0.25)] disabled:bg-[#E6E6EA] disabled:from-[#E6E6EA] disabled:to-[#E6E6EA] disabled:text-[#999] disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 min-h-screen bg-[#0a1628] items-center justify-center p-12">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to <span className="text-[#00D1B4]">OTPBUY</span>
          </h1>
          <p className="text-white/70 text-sm mb-8">
            Super Fast and Easy way to <span className="font-semibold text-white">Receive SMS Online.</span>
          </p>
          <OptimizedImage 
            src={smsIllustration} 
            alt="SMS Illustration" 
            className="w-full max-w-[380px] mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
