import { Divider } from "../layout/divider";
import { Horizontal } from "../layout/Stack";

import { Vertical } from "../layout/Stack";
import { DirectusIcon, DirectusIconName } from "./directus-icon";
import { H3 } from "./typography";

export const DividerSubtitle = ({
  icon,
  title,
}: {
  icon?: DirectusIconName;
  title: string;
}) => {
  return (
    <Vertical spacing="xs">
      <Horizontal>
        {icon && <DirectusIcon name={icon} />}
        <H3>{title}</H3>
      </Horizontal>
      <Divider />
    </Vertical>
  );
};
