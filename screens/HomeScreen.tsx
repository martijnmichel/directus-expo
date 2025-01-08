import { Layout } from "@/components/layout/Layout";
import { Center } from "@/components/layout/Center";
import { Container } from "@/components/layout/Container";
import { HStack, VStack } from "@/components/layout/Stack";
import { Text } from "react-native";

export const HomeScreen = () => {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Center>
          <VStack spacing={16}>
            <Text>Header</Text>

            <HStack spacing={8}>
              <Text>Left</Text>
              <Text>Right</Text>
            </HStack>

            <Text>Footer</Text>
          </VStack>
        </Center>
      </Container>
    </Layout>
  );
};
