import { useModalStore } from "@/state/stores/modalStore";
import { Stack } from "expo-router";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";

const DynamicModal = () => {
  const { Content, title, close } = useModalStore();
  return (
    <Layout>
      <Stack.Screen options={{ title: title || "Modal" }} />
      <Container>{Content ? <Content /> : null}</Container>
    </Layout>
  );
};

export default DynamicModal;
