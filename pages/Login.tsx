
import React, { useState, useId } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sendOtp, register } from '../services/api';
import { LogoIcon } from '../components/icons';
import Modal from '../components/Modal';
import TermsOfService from '../components/TermsOfService';
import MarketingConsent from '../components/MarketingConsent';

const NeumorphicInput = ({ id, error, ...props }: { id: string, error: boolean, [key: string]: any }) => (
    <input
        id={id}
        className="w-full px-4 py-3 bg-[#F0EBE3] rounded-xl border-none shadow-inner transition-shadow focus:shadow-[inset_4px_4px_8px_#cdc8c2,inset_-4px_-4px_8px_#ffffff] focus:outline-none"
        aria-required="true"
        aria-invalid={error}
        {...props}
    />
);

const NeumorphicButton = ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => (
     <button
        {...props}
        className="w-full bg-[#4A2B2C] text-white py-3 rounded-xl font-semibold shadow-[5px_5px_10px_#cdc8c2,-5px_-5px_10px_#ffffff] transition-all hover:bg-opacity-90 active:shadow-inner disabled:opacity-50"
      >
        {children}
    </button>
);

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [step, setStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);

  const termsModalTitleId = useId();
  const marketingModalTitleId = useId();


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await register({ fullName, phone, organizationName });
      setSuccessMessage('ההרשמה הצליחה! אנא התחבר באמצעות הקוד שנשלח לטלפון שלך.');
      setIsRegistering(false);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F0EBE3] to-[#E0D8CF] p-4">
      <div className="w-full max-w-sm mx-auto bg-[#F0EBE3] rounded-3xl shadow-[10px_10px_20px_#cdc8c2,-10px_-10px_20px_#ffffff] p-8">
        <div className="flex justify-center mb-6">
          <LogoIcon className="h-16 w-16 text-[#4A2B2C]" />
        </div>
        <h2 className="text-2xl font-bold text-center text-[#4A2B2C] mb-2">
            {isRegistering ? 'יצירת חשבון חדש' : 'ברוכים הבאים'}
        </h2>
        <p className="text-center text-gray-500 mb-8">
            {isRegistering ? 'הצטרף ונהל את הפרויקטים שלך בקלות' : 'ניהול פרויקטים מתחיל כאן'}
        </p>
        
        {successMessage && <p role="status" aria-live="polite" className="text-green-600 bg-green-100 border border-green-300 rounded-lg p-3 text-center mb-4 text-sm">{successMessage}</p>}
        {error && <p role="alert" aria-live="assertive" className="text-red-500 text-center mt-4">{error}</p>}

        {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4" key="register-form">
                 <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-600 mb-2">שם מלא</label>
                    <NeumorphicInput type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" error={!!error} />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-2">מספר טלפון</label>
                    <NeumorphicInput type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-123-4567" error={!!error} />
                </div>
                 <div>
                    <label htmlFor="orgName" className="block text-sm font-medium text-gray-600 mb-2">שם הארגון</label>
                    <NeumorphicInput type="text" id="orgName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="החברה שלי בעמ" error={!!error} />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center">
                      <input
                          id="terms"
                          name="terms"
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="h-4 w-4 text-[#4A2B2C] focus:ring-[#4A2B2C] border-gray-400 rounded"
                      />
                      <label htmlFor="terms" className="mr-2 text-sm text-gray-600">
                          אני מסכים ל
                          <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-[#4A2B2C] hover:underline font-semibold mx-1">
                              תנאי השירות
                          </button>
                      </label>
                  </div>
                  <div className="flex items-center">
                      <input
                          id="marketing"
                          name="marketing"
                          type="checkbox"
                          checked={agreedToMarketing}
                          onChange={(e) => setAgreedToMarketing(e.target.checked)}
                          className="h-4 w-4 text-[#4A2B2C] focus:ring-[#4A2B2C] border-gray-400 rounded"
                      />
                      <label htmlFor="marketing" className="mr-2 text-sm text-gray-600">
                          אני מסכים לקבל
                          <button type="button" onClick={() => setIsMarketingModalOpen(true)} className="text-[#4A2B2C] hover:underline font-semibold mx-1">
                            תוכן שיווקי
                          </button>
                      </label>
                  </div>
              </div>


                <NeumorphicButton type="submit" disabled={loading || !agreedToTerms}>
                    {loading ? 'רושם...' : 'הירשם'}
                </NeumorphicButton>
            </form>
        ) : step === 1 ? (
          <form onSubmit={handleSendOtp} key="send-otp-form">
            <div className="mb-4">
              <label htmlFor="phone-login" className="block text-sm font-medium text-gray-600 mb-2">מספר טלפון</label>
              <NeumorphicInput type="tel" id="phone-login" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-123-4567" error={!!error} />
            </div>
            <NeumorphicButton type="submit" disabled={loading}>
              {loading ? 'שולח...' : 'שלח קוד'}
            </NeumorphicButton>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} key="verify-otp-form">
            <div className="mb-4">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-600 mb-2">קוד אימות</label>
              <NeumorphicInput type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" error={!!error} />
            </div>
            <NeumorphicButton type="submit" disabled={loading}>
              {loading ? 'מאמת...' : 'התחבר'}
            </NeumorphicButton>
          </form>
        )}
        
        <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMessage(''); }} className="text-sm text-gray-600 hover:text-[#4A2B2C] hover:underline">
                {isRegistering ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
            </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
            Open TN Creation
        </p>
      </div>

       <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} titleId={termsModalTitleId} size="lg">
          <TermsOfService onClose={() => setIsTermsModalOpen(false)} />
       </Modal>
       <Modal isOpen={isMarketingModalOpen} onClose={() => setIsMarketingModalOpen(false)} titleId={marketingModalTitleId} size="lg">
          <MarketingConsent onClose={() => setIsMarketingModalOpen(false)} />
       </Modal>

    </div>
  );
};

export default LoginPage;
