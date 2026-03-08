import { t } from "@/i18n/translate";
import type { I18nMessageKey } from "@/i18n/messages";

type Props = {
  titleKey: I18nMessageKey;
  requirementsKey: I18nMessageKey;
};

export function PanelHeader({ titleKey, requirementsKey }: Props) {
  return (
    <div className="panelHeader">
      <h2>{t(titleKey)}</h2>
      <p>{t(requirementsKey)}</p>
    </div>
  );
}
