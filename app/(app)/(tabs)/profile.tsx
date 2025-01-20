import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { Button } from "@/components/display/button";
import { FloatingToolbar } from "@/components/display/floating-toolbar";
import { Plus } from "@/components/icons";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { Horizontal } from "@/components/layout/Stack";
import { useAuth } from "@/contexts/AuthContext";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";
import { usePermissions } from "@/state/queries/directus/core";
import { CoreSchema } from "@directus/sdk";
import { Link, Stack } from "expo-router";
import { ScrollView } from "react-native";
export default function TabTwoScreen() {
  const { user } = useAuth();
  const { data: permissions } = usePermissions();

  const canCreate = isActionAllowed("directus_users", "create", permissions);
  return (
    <Layout>
      <Horizontal>
        {canCreate && (
          <Link asChild href={`/content/directus_users/+`}>
            <Button>
              <Plus />
            </Button>
          </Link>
        )}
      </Horizontal>
      <ScrollView>
        <CollectionDataTable collection="directus_users" />
      </ScrollView>

      <FloatingToolbar />
    </Layout>
  );
}
