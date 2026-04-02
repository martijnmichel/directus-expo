import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useModalStore } from '@/state/stores/modalStore';
import { useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { Container } from '../layout/Container';

export default function DynamicModal() {
  const { Content, title, close } = useModalStore();

  // If user swipes down to close, clear the store
  useEffect(() => {
    return () => close(); 
  }, []);

  return (
    <Layout>
        <Container>

        {Content ? <Content /> : null}
        </Container>
      <Stack.Screen options={{ title: title || 'Modal' }} />
    </Layout>
  );
}
