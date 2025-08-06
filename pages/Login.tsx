import React, { useState, useId } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loginWithEmail, registerUserWithEmail } from '../services/api';
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
  // login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // register state
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  // other ui states
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

  const errorMessagesHe = {
  'Invalid email or password': "אימייל או סיסמה לא נכונים",
  'User not found.': "המשתמש לא נמצא",
  'Invalid password.': "הסיסמה שגויה",
  'User with this email already exists.': "משתמש עם אימייל זה כבר קיים",
  'Registration failed': "ההרשמה נכשלה",
  'User with this phone number already exists.': "משתמש עם מספר טלפון זה כבר קיים",
  'OTP expired or not sent. Please request a new one.': "הקוד פג תוקף או לא נשלח. אנא בקש קוד חדש.",
  'Invalid OTP code.': "קוד אימות שגוי",
  'User has no active memberships. Please contact support.': "למשתמש אין חברות פעילה בארגון. אנא צור קשר עם התמיכה.",
  'User profile not found.': "פרופיל המשתמש לא נמצא",
  'Failed to send OTP': "שליחת קוד אימות נכשלה",
};

  // התחברות אימייל וסיסמה
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      login(email, password); // שמור טוקן ומשתמש
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // הרשמה אימייל וסיסמה
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await registerUserWithEmail(fullName, registerEmail, registerPassword, organizationName);
      setSuccessMessage('ההרשמה הצליחה! עכשיו ניתן להתחבר.');
      setIsRegistering(false);
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
                    <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-600 mb-2">אימייל</label>
                    <NeumorphicInput type="email" id="registerEmail" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="your@email.com" error={!!error} />
                </div>
                <div>
                    <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-600 mb-2">סיסמה</label>
                    <NeumorphicInput type="password" id="registerPassword" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="******" error={!!error} />
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
        ) : (
          <form onSubmit={handleLogin} key="login-form">
            <div className="mb-4">
              <label htmlFor="email-login" className="block text-sm font-medium text-gray-600 mb-2">אימייל</label>
              <NeumorphicInput type="email" id="email-login" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" error={!!error} />
            </div>
            <div className="mb-4">
              <label htmlFor="password-login" className="block text-sm font-medium text-gray-600 mb-2">סיסמה</label>
              <NeumorphicInput type="password" id="password-login" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" error={!!error} />
            </div>
            <NeumorphicButton type="submit" disabled={loading}>
              {loading ? 'מתחבר...' : 'התחבר'}
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