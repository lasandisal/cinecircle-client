import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TasteOnboardingWizard } from '../components/onboarding/TasteOnboardingWizard';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="py-6 px-4">
      <TasteOnboardingWizard
        isOpen={true}
        isStandalone={true}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default OnboardingPage;
