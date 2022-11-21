import { StripeProvider } from '@stripe/stripe-react-native';
import CheckoutScreen from './views/Routes';

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_51M52fAJTjzJ1ecQAez5XjYXoc3SQQQGiSwwHwmNTQvyQj3LXdJ63aTcneBXisfxrojPDu9uqrtbQzJ2FWhWG5n7Y00neRu4ke0"
      merchantIdentifier="merchant.me.example"
    >
      <CheckoutScreen />
    </StripeProvider>
  );
}
