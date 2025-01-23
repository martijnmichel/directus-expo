import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Modal } from "./display/modal";
import { Text } from "./display/typography";
import { Divider } from "./layout/divider";
import { Button } from "./display/button";
import { useTranslation } from "react-i18next";

export const OTAUpdate = () => {
  const [updateModal, setUpdateModal] = useState<Updates.UpdateCheckResult>();

  const { t } = useTranslation();

  const doUpdate = async () => {
    try {
      const re = await Updates.fetchUpdateAsync();
      if (re.isNew) {
        await Updates.reloadAsync();
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) setUpdateModal(update);
    } catch (e) {
      console.log(e);
    }
  };

  /** Refetch Order on App focus */

  /** Listen for app state changes */
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      if (status === "active") fetchUpdate();
    }
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <Modal open={!!updateModal} onClose={() => setUpdateModal(undefined)}>
      <Modal.Content title={t("components.ota.updateAvailableTitle")}>
        <Text>{t("components.ota.updateAvailable")}</Text>

        <Divider />

        <Button onPress={() => doUpdate()}>OK</Button>
      </Modal.Content>
    </Modal>
  );
};
