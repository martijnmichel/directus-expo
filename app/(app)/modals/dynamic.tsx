import { useModalStore } from "@/state/stores/modalStore";
import { Stack } from "expo-router";
import { View } from "react-native";

const DynamicModal = () => {
    const { Content, title, close } = useModalStore();
    return <View>
        <Stack.Screen options={{ title: title || 'Modal' }} />
        {Content ? <Content /> : null}
    </View>
}

export default DynamicModal;