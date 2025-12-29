import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomToast } from '@/components/ui/custom-toast';
import { z } from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import smsIllustration from '@/assets/sms-illustration.png';
import logo from '@/assets/logo.png';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [valid, setValid] = useState<{ email?: boolean; password?: boolean }>({});
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const { showToast, updateToast } = useCustomToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const validateField = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      const result = z.string().email('Please enter a valid email address').safeParse(value);
      setErrors(prev => ({ ...prev, email: result.success ? undefined : result.error.errors[0].message }));
      setValid(prev => ({ ...prev, email: result.success && value.length > 0 }));
    } else {
      const result = z.string().min(6, 'Password must be at least 6 characters').safeParse(value);
      setErrors(prev => ({ ...prev, password: result.success ? undefined : result.error.errors[0].message }));
      setValid(prev => ({ ...prev, password: result.success }));
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Show captcha modal instead of logging in directly
    setShowCaptchaModal(true);
  };

  const handleCaptchaChange = (token: string | null) => {
    if (token) {
      setCaptchaVerified(true);
    }
  };

  const handleCaptchaLogin = async () => {
    if (!captchaVerified) {
      showToast('Verify captcha', 'error');
      return;
    }

    setShowCaptchaModal(false);
    setIsLoading(true);
    const toastId = showToast('Logging in...', 'loading', true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      const errorMessage = error.message === 'Invalid credentials' 
        ? 'Invalid credentials...' 
        : error.message;
      updateToast(toastId, errorMessage, 'error');
    } else {
      updateToast(toastId, 'Login successful!', 'success');
    }
    
    // Reset captcha state
    setCaptchaVerified(false);
    recaptchaRef.current?.reset();
  };

  const handleCloseModal = () => {
    setShowCaptchaModal(false);
    setCaptchaVerified(false);
    recaptchaRef.current?.reset();
  };

  if (loading || isLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-4 xs:px-6 sm:px-12 lg:px-20 py-8 xs:py-12 lg:py-0 lg:min-h-screen relative">
        {/* Logo - positioned at top on all screens */}
        <div className="w-full max-w-[500px] mb-6 xs:mb-8 lg:absolute lg:top-8 lg:left-8 lg:mb-0 lg:w-auto">
          <OptimizedImage src={logo} alt="Logo" className="w-10 h-10 xs:w-12 xs:h-12" priority />
        </div>

        <div className="w-full max-w-[500px]">
          {/* Heading */}
          <h1 className="font-inter text-[28px] sm:text-[32px] font-bold text-[#111] leading-tight mb-1">
            Login
          </h1>
          <p className="text-sm text-[#666] mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[rgb(99,102,241)] hover:underline font-medium transition-colors">
              Register
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#333]">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateField('email', e.target.value);
                  }}
                  onBlur={() => handleBlur('email')}
                  className={`w-full h-[48px] px-4 pr-12 rounded-lg border ${
                    touched.email && errors.email 
                      ? 'border-[#E53935] focus:ring-[#E53935]/20 focus:border-[#E53935]' 
                      : valid.email 
                        ? 'border-[#22C55E] focus:ring-[#22C55E]/20 focus:border-[#22C55E]' 
                        : 'border-[#E9EDF2] focus:ring-[#6B5BF7]/20 focus:border-[#6B5BF7]'
                  } bg-white placeholder-[#9AA0A6] text-[#111] focus:outline-none focus:ring-2 transition-all`}
                  disabled={isLoading}
                />
                {valid.email && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Check className="h-5 w-5 text-[#22C55E]" />
                  </div>
                )}
                {touched.email && errors.email && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-5 w-5 text-[#E53935]" />
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="text-[#E53935] text-sm flex items-center gap-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#333]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validateField('password', e.target.value);
                  }}
                  onBlur={() => handleBlur('password')}
                  className={`w-full h-[48px] px-4 pr-24 rounded-lg border ${
                    touched.password && errors.password 
                      ? 'border-[#E53935] focus:ring-[#E53935]/20 focus:border-[#E53935]' 
                      : valid.password 
                        ? 'border-[#22C55E] focus:ring-[#22C55E]/20 focus:border-[#22C55E]' 
                        : 'border-[#E9EDF2] focus:ring-[#6B5BF7]/20 focus:border-[#6B5BF7]'
                  } bg-white placeholder-[#9AA0A6] text-[#111] focus:outline-none focus:ring-2 transition-all`}
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {valid.password && (
                    <Check className="h-5 w-5 text-[#22C55E]" />
                  )}
                  {touched.password && errors.password && (
                    <AlertCircle className="h-5 w-5 text-[#E53935]" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#666] hover:text-[#333] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {touched.password && errors.password && (
                <p className="text-[#E53935] text-sm flex items-center gap-1">
                  {errors.password}
                </p>
              )}
              {password.length > 0 && password.length < 6 && !touched.password && (
                <p className="text-[#9AA0A6] text-sm">
                  {6 - password.length} more characters needed
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] rounded-lg text-white text-base font-semibold bg-gradient-to-r from-[#6B5BF7] to-[#6F6DFE] shadow-[0_6px_18px_rgba(107,91,247,0.18)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(107,91,247,0.25)] disabled:bg-[#E6E6EA] disabled:from-[#E6E6EA] disabled:to-[#E6E6EA] disabled:text-[#999] disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Continue'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#E9EDF2]" />
              <span className="text-sm text-[#9AA0A6]">or</span>
              <div className="flex-1 h-px bg-[#E9EDF2]" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={async () => {
                const { error } = await signInWithGoogle();
                if (error) {
                  showToast('Google login failed', 'error');
                }
              }}
              disabled={isLoading}
              className="w-full h-[52px] rounded-lg text-[#333] text-base font-medium bg-white border border-[#E9EDF2] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

          </form>
        </div>
      </div>

      {/* reCAPTCHA Modal */}
      {showCaptchaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 xs:p-6 w-full max-w-sm mx-auto">
            <h3 className="text-sm xs:text-base font-semibold text-[#111] mb-4">
              Verify you are not a robot
            </h3>
            
            <div className="mb-4 flex justify-center overflow-x-auto">
              <div className="transform scale-[0.85] xs:scale-100 origin-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  onChange={handleCaptchaChange}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 xs:gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 xs:px-6 py-2 xs:py-2.5 rounded-md border border-[#D1D5DB] bg-white text-[#374151] text-sm font-medium hover:bg-[#F9FAFB] transition-colors min-h-[44px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCaptchaLogin}
                disabled={!captchaVerified}
                className="px-4 xs:px-6 py-2 xs:py-2.5 rounded-md bg-[#E5E7EB] text-[#9CA3AF] text-sm font-medium disabled:cursor-not-allowed transition-colors enabled:bg-[#6B5BF7] enabled:text-white enabled:hover:bg-[#5A4DE6] min-h-[44px]"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Panel - Hero (Desktop: side-by-side, Mobile/Tablet: stacked below) */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 lg:min-h-screen relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, #0f1f3c 0%, #0a1628 50%, #060d1a 100%)'
        }}
      >
        {/* Bottom teal glow accent */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0, 209, 180, 0.15) 0%, transparent 100%)'
          }}
        />
        <div className="text-center w-full max-w-md lg:max-w-xl xl:max-w-2xl py-12 lg:py-0 relative z-10 px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.75rem] font-bold text-white mb-2 sm:mb-3 lg:mb-4 leading-tight">
            Welcome to <span className="text-[#00D1B4]">OTPBUY</span>
          </h2>
          <p className="text-white/80 text-sm sm:text-base lg:text-lg xl:text-xl mb-6 lg:mb-8">
            Super Fast and Easy way to <span className="font-semibold">Receive SMS Online.</span>
          </p>
          {/* SVG illustration - responsive sizing */}
          <img 
            src={smsIllustration} 
            alt="SMS Illustration" 
            loading="eager"
            fetchPriority="high"
            className="hidden lg:block w-full max-w-[400px] lg:max-w-[480px] xl:max-w-[540px] 2xl:max-w-[600px] mx-auto animate-fade-in"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
