import { useTranslation } from "react-i18next";
import { Card } from "@generic/components";

export default function PlanningScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <Card>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          {t("planning.title")}
        </h1>
        <p className="mt-3 text-sm text-gray-500">{t("planning.newSession")}</p>
      </Card>
    </div>
  );
}
