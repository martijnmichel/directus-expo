import { H1 } from "@/components/display/typography";
import CollectionLayout from "@/components/layout/CollectionLayout";
import { PortalOutlet } from "@/components/layout/Portal";
import { View } from "react-native";

export default function Home() {
  return (
    <CollectionLayout>
      <H1>Dashboard</H1>
    </CollectionLayout>
  );
}
