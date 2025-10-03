export type RootStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    email: string;
    resetToken: string;
  };
  VerifyResetCode: {
    email: string;
  };
  Balance: undefined;
  Profile: undefined;
  ChooseFortuneType: undefined;
  StarMap: { advisorId: number;
    advisorPrice: number;  };
  SolarReturn: { 
    advisorId: number;
    advisorPrice: number; 
  };
  TarotCardSelection:{ 
    advisorId: number;
    advisorPrice: number; 
  };
  Transit: { advisorId: number;
    advisorPrice: number;  };
   HistoryDetail: { fortuneId: number; onGoBack: () => void };
   Advisors: undefined;
FortuneHistory: undefined;
PurchaseHistory: undefined;
Init: undefined;
 CoffeeUpload: {
    advisorId: number;
    advisorName: string;
    advisorPrice: number;
  };

  Commentator: {
    fortuneName: string;
  };
Dream: {
  advisorId: number;
  advisorPrice: number;
};
  // ekranlar geldikçe buraya eklenir
// types/navigation.ts
  Compatibility: { advisorId: string; advisorPrice: number };

};
