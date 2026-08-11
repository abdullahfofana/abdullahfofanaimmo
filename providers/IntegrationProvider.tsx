import { useEffect, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreditCard, Mail, MessageSquare, Webhook, Zap, Database } from 'lucide-react-native';

export type IntegrationType = 'payment' | 'email' | 'sms' | 'crm' | 'storage' | 'automation';

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  icon: any;
  color: string;
  fields: IntegrationField[];
}

export interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required?: boolean;
}

export interface ConnectedIntegration {
  id: string;
  connected: boolean;
  config: Record<string, string>;
  connectedAt: string;
}

const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing for property transactions and subscriptions.',
    type: 'payment',
    icon: CreditCard,
    color: '#635BFF',
    fields: [
      { name: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_test_...', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...', required: true },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Alternative payment gateway for global transactions.',
    type: 'payment',
    icon: CreditCard,
    color: '#00457C',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'orange_money',
    name: 'Orange Money',
    description: 'Local mobile money payments for Ivory Coast.',
    type: 'payment',
    icon: Zap,
    color: '#FF7900',
    fields: [
      { name: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'mtn_money',
    name: 'MTN Mobile Money',
    description: 'Secure mobile payments via MTN network.',
    type: 'payment',
    icon: Zap,
    color: '#FFCB05',
    fields: [
      { name: 'userId', label: 'User ID', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  
  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows by connecting to 5,000+ apps.',
    type: 'automation',
    icon: Zap,
    color: '#FF4A00',
    fields: [
      { name: 'webhookUrl', label: 'Zapier Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/...', required: true },
    ],
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Visual platform to build and automate complex workflows.',
    type: 'automation',
    icon: Zap,
    color: '#6F3FF5',
    fields: [
      { name: 'webhookUrl', label: 'Make Webhook URL', type: 'url', placeholder: 'https://hook.us1.make.com/...', required: true },
    ],
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    description: 'Send real-time data to your own endpoints.',
    type: 'automation',
    icon: Webhook,
    color: '#2563EB',
    fields: [
      { name: 'endpointUrl', label: 'Endpoint URL', type: 'url', placeholder: 'https://api.yoursite.com/webhook', required: true },
      { name: 'secret', label: 'Signing Secret', type: 'password', placeholder: 'Optional signing secret' },
    ],
  },

  // CRM
  {
    id: 'external_software',
    name: 'External Software',
    description: 'Full API integration with your custom external software.',
    type: 'crm',
    icon: Database,
    color: '#475569',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'endpointUrl', label: 'Endpoint URL', type: 'url', placeholder: 'https://api.external.com/v1', required: true },
    ],
  },

  // Email
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery service for transactional emails.',
    type: 'email',
    icon: Mail,
    color: '#1A82E2',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },

  // SMS
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and communication API.',
    type: 'sms',
    icon: MessageSquare,
    color: '#F22F46',
    fields: [
      { name: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { name: 'authToken', label: 'Auth Token', type: 'password', required: true },
    ],
  },
];

export const [IntegrationProvider, useIntegrations] = createContextHook(
  () => {
    const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, ConnectedIntegration>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load saved integrations on mount
    useEffect(() => {
      loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
      try {
        const stored = await AsyncStorage.getItem('connected_integrations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            setConnectedIntegrations(parsed);
          } else {
            setConnectedIntegrations({});
          }
        } else {
          // Default mock connections if nothing stored
          setConnectedIntegrations({
            orange_money: {
              id: 'orange_money',
              connected: true,
              config: { merchantId: 'mock_merchant' },
              connectedAt: new Date().toISOString(),
            },
            mtn_money: {
              id: 'mtn_money',
              connected: true,
              config: { userId: 'mock_user' },
              connectedAt: new Date().toISOString(),
            },
            zapier: {
              id: 'zapier',
              connected: true,
              config: { webhookUrl: 'https://hooks.zapier.com/hooks/catch/...' },
              connectedAt: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.log('Integration loading error (using defaults):', error);
        setConnectedIntegrations({});
      } finally {
        setIsLoading(false);
      }
    };

    const saveIntegrations = async (integrations: Record<string, ConnectedIntegration>) => {
      try {
        await AsyncStorage.setItem('connected_integrations', JSON.stringify(integrations));
      } catch (error) {
        console.error('Failed to save integrations', error);
      }
    };

    const connectIntegration = (id: string, config: Record<string, string>) => {
      const newIntegration: ConnectedIntegration = {
        id,
        connected: true,
        config,
        connectedAt: new Date().toISOString(),
      };
      
      const updated = {
        ...connectedIntegrations,
        [id]: newIntegration,
      };
      
      setConnectedIntegrations(updated);
      saveIntegrations(updated);
    };

    const disconnectIntegration = (id: string) => {
      const updated = { ...connectedIntegrations };
      delete updated[id];
      
      setConnectedIntegrations(updated);
      saveIntegrations(updated);
    };

    const isConnected = (id: string) => {
      return !!connectedIntegrations[id]?.connected;
    };

    const getDefinitionsByType = (type: IntegrationType) => {
      return INTEGRATION_DEFINITIONS.filter(def => def.type === type);
    };

    // API Key generation for external software
    const [apiKeys, setApiKeys] = useState<{key: string, name: string, created: string}[]>([]);
    
    const generateApiKey = (name: string) => {
      const newKey = {
        key: 'sk_live_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9),
        name,
        created: new Date().toISOString()
      };
      const updatedKeys = [...apiKeys, newKey];
      setApiKeys(updatedKeys);
      // In a real app, we'd save this to AsyncStorage too
      return newKey;
    };

    const revokeApiKey = (key: string) => {
      setApiKeys(apiKeys.filter(k => k.key !== key));
    };

    return {
      definitions: INTEGRATION_DEFINITIONS,
      connectedIntegrations,
      isLoading,
      connectIntegration,
      disconnectIntegration,
      isConnected,
      getDefinitionsByType,
      apiKeys,
      generateApiKey,
      revokeApiKey,
    };
  },
  {
    definitions: INTEGRATION_DEFINITIONS,
    connectedIntegrations: {},
    isLoading: true,
    connectIntegration: () => {},
    disconnectIntegration: () => {},
    isConnected: () => false,
    getDefinitionsByType: () => [],
    apiKeys: [],
    generateApiKey: () => ({ key: '', name: '', created: '' }),
    revokeApiKey: () => {},
  }
);
