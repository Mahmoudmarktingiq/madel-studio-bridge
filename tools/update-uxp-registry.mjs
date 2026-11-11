import { writeFileSync } from "node:fs";
import { join } from "node:path";

const targetDir = "C:/Users/asus/AppData/Roaming/Adobe/UXP/PluginsInfo/v1";
const registryData = {
  plugins: [
    {
      hostMinVersion: "25.6.0",
      name: "MADEL Studio Bridge",
      path: "$localPlugins\\External\\com.madel.studio-bridge.premiere_0.4.0",
      pluginId: "com.madel.studio-bridge.premiere",
      status: "enabled",
      type: "uxp",
      versionString: "0.4.0",
    },
  ],
};

const jsonContent = JSON.stringify(registryData, null, 2);

for (const filename of ["PPRO.json", "PR.json", "premierepro.json"]) {
  const dest = join(targetDir, filename);
  writeFileSync(dest, jsonContent, "utf8");
  console.log(`Updated ${dest}`);
}
