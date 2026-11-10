# المهارات والإضافات والوكلاء الموجودون

تم الجرد بأسماء ملفات `SKILL.md` وحقول frontmatter الآمنة وبصمات SHA-256، دون تشغيل تعليماتها. في الجداول أدناه تعني البصمة تطابق ذلك الملف فقط. قد تختلف الموارد والسكربتات المصاحبة.

## Claude Code

- في `~\.claude\skills` توجد 21 مهارة شخصية. 19 وصلة إلى `~\.agents\skills`. `capcut-edit` و`graphify` ملفان مستقلان في هذا الجذر. يوجد `graphify.exe` و`graphify-mcp.exe` في `~\.local\bin`. لم يظهر تسجيل MCP لـGraphify في النطاقات المدققة.
- `D:\GoogleAntigravity\LiloMediaWorkspace\.claude\skills` يضيف `build-dist` و`change-report` على مستوى المشروع. لم يظهر مجلد وكلاء مستخدم `~\.claude\agents`.
- يظهر Marketplace الرسمي `claude-plugins-official` في سجل المصادر. لم يظهر `installed_plugins.json` أو قسم `enabledPlugins` أو cache تثبيت عادي في مواضع الفحص. `plugins\data` يحتوي مجلدات فارغة لـ`cargo-inline` و`desktop-commander-inline` و`pdf-viewer-inline`. ملف `cc-plugin-agents-md_builtin-…json` في store يحمل سجل استخدام، وليس سجل تفعيل. حالة الإضافات المدمجة أو السحابية لا تُحسم بهذه الآثار وحدها. [مرجع إضافات Claude](https://code.claude.com/docs/en/plugins-reference)
- رُصد **92 ملف وكيل مخصص** في المشاريع المعروفة المفحوصة. اثنان في `LiloMediaWorkspace` هما `code-navigator` و`release-auditor`. الثلاثون الآخرون موجودون بثلاث نسخ متطابقة عبر `Lilo WebSite\lilo web site` و`luxuria-iq` و`luxuria-iq\app-luxuria.iq` تحت `.claude\agents`. بصمة قائمة الأسماء وبصمات الملفات لكل مجموعة `95e626a450e1`. في المشروع المتداخل يمكن أن تصبح الأسماء متنافسة حسب جذر الجلسة. الأسماء هي `archon`، `atlas`، `aurora`، `axiom`، `cipher`، `commerce`، `comply`، `data`، `echo`، `forge`، `kernel`، `lingua`، `linker`، `mirror`، `module`، `nexus`، `orbit`، `paradox`، `phoenix`، `prism`، `product`، `pulse`، `release`، `scribe`، `sentinel`، `sentry`، `synapse`، `turbo`، `vector`، `vision`.

## Codex

- لا توجد مهارات مستخدم مباشرة تحت `~\.codex\skills\<skill>\SKILL.md`. توجد 5 تحت `.system`، و20 في الجذر المشترك `~\.agents\skills`. ظهور ملف نظام في الجرد لا يثبت أنه معروض لكل جلسة.
- يحدد TOML ‏11 إضافة بقيمة `enabled=true`. إضافات `openai-primary-runtime` هي `documents` و`spreadsheets` و`presentations` و`pdf` و`template-creator`. إضافات `openai-bundled` هي `chrome` و`visualize` و`codex-app-tools` و`computer-use` و`browser` و`unified-computer-use`.
- ظهر **79 ملف مهارة** تحت cache الإضافات. تتضمن الحزم البعيدة Adobe وMagnific وCanva وGitHub وData Analytics وHyperFrames وOpenAI Templates وPlugin Management وSites وVisualize وWork Pets. بعض أدواتها مكشوفة لهذه الجلسة من خلال runtime. cache وحده لا يثبت تفعيل الحزمة أو تسجيل الدخول أو صلاحية تنفيذ الأداة. حزمة Adobe السحابية مستقلة عن Brainferno المحلي.
- يوجد `visualize` بنسخة مجمعة `1.0.84` ونسخة بعيدة `1.0.89` ببصمتين مختلفتين. عُرضت النسخة البعيدة لهذه الجلسة. توجد إحالة `latest` لحزمة Chrome إلى جانب مجلد إصدار رقمي. لا يظهر قسم وكلاء مخصصين أو مجلد `~\.codex\agents` في جرد المستخدم.

## Antigravity

- المجلد `~\.gemini\config\skills` يحتوي `capcut-edit` فقط. توجد 10 مهارات مدمجة في `~\.gemini\antigravity\builtin`، و44 في إضافات config، و8 في إضافة SecureCoder لنطاق IDE. مهارات الحزم تعتمد على السطح وحالة الإضافة.
- الإضافات الأربع في `~\.gemini\config\config.json` مفعلة صراحة. وهي `android-cli-plugin 1.0.16625370` و`google-antigravity-sdk 0.0.4` و`modern-web-guidance-plugin 1.0.4` و`science 1.3.1`. manifest الخاص بـ`Google.securecoder.securecoder` في ملف تعريف IDE يحمل `disabled=false` دون إصدار. الفحص لا يثبت تنفيذ أدوات هذه الحزم في المحادثة الحالية.
- رُصدت إضافات محرر في `~\.antigravity\extensions`، منها Python وDart/Flutter وGitLens وPowerShell وCline وOpenAI ChatGPT، وكذلك `munkhin.auto-accept-agent 13.0.0`. هذه إضافات IDE منفصلة عن حزم الوكيل. ملف إعدادات المحرر JSONC يحتوي على اسم خيار `tfa.system.autoAccept`. لم يُستنتج من وجوده أن الموافقات التلقائية نشطة.
- ملف `~\.gemini\GEMINI.md` فارغ. وُجد `~\AGENTS.md`. لم تظهر مجلدات `agents` أو `rules` تحت `~\.gemini\config`. يوجد workflow على مستوى مشروع في `luxuria-iq\app-luxuria.iq\.agents\workflows\review_ui.md`. تُطبّق أولوية قواعد المستخدم والمشروع وملحقات التوافق وفق السطح وجذر العمل. [مهارات Antigravity](https://antigravity.google/docs/skills?tab=ide)

## التكرار المؤثر

| الحالة | الدليل | المعالجة بعد الموافقة |
|---|---|---|
| `capcut-edit` ثلاث مرات | بصمة `7eba75d77e4d` في Claude والجذر المشترك وAntigravity. متن المهارة يصف v0.11 بينما CLI ‏0.33.1 | اختر مصدراً واحداً، تحقق من سكربتات كل نسخة، وراجع الأوامر وفق عقد الإصدار الفعلي |
| 19 مهارة مشتركة | وصول Claude إلى نفس الملف عبر وصلة مقابل اكتشاف Codex للجذر المشترك | احتفظ بالوصلات المطلوبة للوصول متعدد العملاء وسجّل المصدر؛ لا تُحسب كنسختين ماديتين |
| 30 تعريف وكيل في ثلاثة جذور | أسماء ومحتوى متطابقان، اثنان من الجذور متداخلان | اختبر النطاق المرجعي قبل دمج أي تعريف |
| `visualize` | نسختان من ناشري قنوات مختلفين في cache | راقب الإصدار المحمّل في الجلسة قبل أي تنظيف |

## ملحق الجرد الكامل للملفات المكتشفة

### `C:\Users\asus\.claude\skills`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `agy-delegate` | `agy-delegate\SKILL.md` | `ea59ed27bc38` | `C:\Users\asus\.agents\skills\agy-delegate\SKILL.md` |
| `aider-delegate` | `aider-delegate\SKILL.md` | `6a8b3d55e3c3` | `C:\Users\asus\.agents\skills\aider-delegate\SKILL.md` |
| `capcut-edit` | `capcut-edit\SKILL.md` | `7eba75d77e4d` | — |
| `claude-delegate` | `claude-delegate\SKILL.md` | `1811281b26a0` | `C:\Users\asus\.agents\skills\claude-delegate\SKILL.md` |
| `cline-delegate` | `cline-delegate\SKILL.md` | `65eef050c053` | `C:\Users\asus\.agents\skills\cline-delegate\SKILL.md` |
| `codex-delegate` | `codex-delegate\SKILL.md` | `fe73bea2e1e0` | `C:\Users\asus\.agents\skills\codex-delegate\SKILL.md` |
| `commandcode-delegate` | `commandcode-delegate\SKILL.md` | `493769b994c3` | `C:\Users\asus\.agents\skills\commandcode-delegate\SKILL.md` |
| `copilot-delegate` | `copilot-delegate\SKILL.md` | `1797584042cd` | `C:\Users\asus\.agents\skills\copilot-delegate\SKILL.md` |
| `cursor-delegate` | `cursor-delegate\SKILL.md` | `1708c8443638` | `C:\Users\asus\.agents\skills\cursor-delegate\SKILL.md` |
| `delegate-setup` | `delegate-setup\SKILL.md` | `d3c0d6acd46e` | `C:\Users\asus\.agents\skills\delegate-setup\SKILL.md` |
| `find-skills` | `find-skills\SKILL.md` | `c00eeea0e13e` | `C:\Users\asus\.agents\skills\find-skills\SKILL.md` |
| `graphify` | `graphify\SKILL.md` | `fd59b563fb59` | — |
| `grok-delegate` | `grok-delegate\SKILL.md` | `e5bfb1b54be7` | `C:\Users\asus\.agents\skills\grok-delegate\SKILL.md` |
| `kimi-delegate` | `kimi-delegate\SKILL.md` | `911b74baf317` | `C:\Users\asus\.agents\skills\kimi-delegate\SKILL.md` |
| `omp-delegate` | `omp-delegate\SKILL.md` | `8abe921b6ec1` | `C:\Users\asus\.agents\skills\omp-delegate\SKILL.md` |
| `opencode-delegate` | `opencode-delegate\SKILL.md` | `35399368a957` | `C:\Users\asus\.agents\skills\opencode-delegate\SKILL.md` |
| `pi-delegate` | `pi-delegate\SKILL.md` | `8e9689a88168` | `C:\Users\asus\.agents\skills\pi-delegate\SKILL.md` |
| `qoder-delegate` | `qoder-delegate\SKILL.md` | `62e9211333b7` | `C:\Users\asus\.agents\skills\qoder-delegate\SKILL.md` |
| `vibe-delegate` | `vibe-delegate\SKILL.md` | `3f9c7ccb39ac` | `C:\Users\asus\.agents\skills\vibe-delegate\SKILL.md` |
| `warp-delegate` | `warp-delegate\SKILL.md` | `15da816f3825` | `C:\Users\asus\.agents\skills\warp-delegate\SKILL.md` |
| `zcode-delegate` | `zcode-delegate\SKILL.md` | `eb3b3143f055` | `C:\Users\asus\.agents\skills\zcode-delegate\SKILL.md` |

### `C:\Users\asus\.codex\skills\.system`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `imagegen` | `imagegen\SKILL.md` | `706d4d96e1d5` | — |
| `openai-docs` | `openai-docs\SKILL.md` | `8ce8021101bc` | — |
| `review-agent` | `review-agent\SKILL.md` | `bb46315f6bc4` | — |
| `skill-creator` | `skill-creator\SKILL.md` | `cccd291077ec` | — |
| `skill-installer` | `skill-installer\SKILL.md` | `2892d8b2fb11` | — |

### `C:\Users\asus\.agents\skills`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `agy-delegate` | `agy-delegate\SKILL.md` | `ea59ed27bc38` | — |
| `aider-delegate` | `aider-delegate\SKILL.md` | `6a8b3d55e3c3` | — |
| `capcut-edit` | `capcut-edit\SKILL.md` | `7eba75d77e4d` | — |
| `claude-delegate` | `claude-delegate\SKILL.md` | `1811281b26a0` | — |
| `cline-delegate` | `cline-delegate\SKILL.md` | `65eef050c053` | — |
| `codex-delegate` | `codex-delegate\SKILL.md` | `fe73bea2e1e0` | — |
| `commandcode-delegate` | `commandcode-delegate\SKILL.md` | `493769b994c3` | — |
| `copilot-delegate` | `copilot-delegate\SKILL.md` | `1797584042cd` | — |
| `cursor-delegate` | `cursor-delegate\SKILL.md` | `1708c8443638` | — |
| `delegate-setup` | `delegate-setup\SKILL.md` | `d3c0d6acd46e` | — |
| `find-skills` | `find-skills\SKILL.md` | `c00eeea0e13e` | — |
| `grok-delegate` | `grok-delegate\SKILL.md` | `e5bfb1b54be7` | — |
| `kimi-delegate` | `kimi-delegate\SKILL.md` | `911b74baf317` | — |
| `omp-delegate` | `omp-delegate\SKILL.md` | `8abe921b6ec1` | — |
| `opencode-delegate` | `opencode-delegate\SKILL.md` | `35399368a957` | — |
| `pi-delegate` | `pi-delegate\SKILL.md` | `8e9689a88168` | — |
| `qoder-delegate` | `qoder-delegate\SKILL.md` | `62e9211333b7` | — |
| `vibe-delegate` | `vibe-delegate\SKILL.md` | `3f9c7ccb39ac` | — |
| `warp-delegate` | `warp-delegate\SKILL.md` | `15da816f3825` | — |
| `zcode-delegate` | `zcode-delegate\SKILL.md` | `eb3b3143f055` | — |

### `C:\Users\asus\.gemini\config\skills`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `capcut-edit` | `capcut-edit\SKILL.md` | `7eba75d77e4d` | — |

### `C:\Users\asus\.gemini\antigravity\builtin`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `agy-customizations` | `skills\agy-customizations\SKILL.md` | `79c8885e76ce` | — |
| `antigravity-guide` | `skills\antigravity_guide\SKILL.md` | `9fc5f6570e91` | — |
| `automation` | `skills\automation\SKILL.md` | `43f296abc2f2` | — |
| `generative_ui` | `skills\generative_ui\SKILL.md` | `ce3390af7b2d` | — |
| `migrate-agent-settings` | `skills\migrate-agent-settings\SKILL.md` | `179abf9a34f9` | — |
| `migrate-workflows` | `skills\migrate-workflows\SKILL.md` | `ee8b18d875bb` | — |
| `permissioned-github` | `skills\permissioned-github\SKILL.md` | `5779716732c7` | — |
| `plugin` | `skills\plugin\SKILL.md` | `61d4b73a11a2` | — |
| `run-workflow` | `skills\run-workflow\SKILL.md` | `4a524107cb61` | — |
| `ui-plugin-navigation` | `skills\ui-plugin-navigation\SKILL.md` | `79ec8489d201` | — |

### `C:\Users\asus\.gemini\config\plugins`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `compose-preview` | `android-cli-plugin\skills\compose-preview\SKILL.md` | `89754aa73899` | — |
| `android-device-hub` | `android-cli-plugin\skills\device-hub\SKILL.md` | `b0d08452d464` | — |
| `android-cli` | `android-cli-plugin\skills\SKILL.md` | `0739dfca5187` | — |
| `alphafold-database-fetch-and-analyze` | `science\skills\alphafold_database_fetch_and_analyze\SKILL.md` | `a16c4defe16c` | — |
| `alphagenome-atlas-website-links` | `science\skills\alphagenome_atlas_website_links\SKILL.md` | `61b050f62470` | — |
| `alphagenome-single-variant-analysis` | `science\skills\alphagenome_single_variant_analysis\SKILL.md` | `bd663b06a6b0` | — |
| `alphagenome-variant-impact-score` | `science\skills\alphagenome_variant_impact_score\SKILL.md` | `047e0b38f3eb` | — |
| `biomolecular-structure-viewer` | `science\skills\biomolecular_structure_viewer\SKILL.md` | `63f2b1a777c7` | — |
| `chembl-database` | `science\skills\chembl_database\SKILL.md` | `67d375e3a869` | — |
| `clinical-trials-database` | `science\skills\clinical_trials_database\SKILL.md` | `d7c3390f01dd` | — |
| `clinvar-database` | `science\skills\clinvar_database\SKILL.md` | `2e3e3e5c79b6` | — |
| `credentials` | `science\skills\credentials\SKILL.md` | `82f252acbf13` | — |
| `dbsnp-database` | `science\skills\dbsnp_database\SKILL.md` | `261817ea3ca4` | — |
| `embl-ebi-ols` | `science\skills\embl_ebi_ols\SKILL.md` | `fd6b63b2d509` | — |
| `encode-ccres-database` | `science\skills\encode_ccres_database\SKILL.md` | `756f1c152088` | — |
| `ensembl-database` | `science\skills\ensembl_database\SKILL.md` | `aff4c6f7c862` | — |
| `foldseek-structural-search` | `science\skills\foldseek_structural_search\SKILL.md` | `3aff6e5f4725` | — |
| `gnomad-database` | `science\skills\gnomad_database\SKILL.md` | `f2082c83ddca` | — |
| `gtex-database` | `science\skills\gtex_database\SKILL.md` | `bbd4c8ac358d` | — |
| `human-protein-atlas-database` | `science\skills\human_protein_atlas_database\SKILL.md` | `35f990cd2348` | — |
| `interpro-database` | `science\skills\interpro_database\SKILL.md` | `ab24b2241057` | — |
| `jaspar-database` | `science\skills\jaspar_database\SKILL.md` | `5cbe866bfd4c` | — |
| `literature-search-arxiv` | `science\skills\literature_search_arxiv\SKILL.md` | `b71daf2b4f84` | — |
| `literature-search-biorxiv` | `science\skills\literature_search_biorxiv\SKILL.md` | `bb9477b5a0b8` | — |
| `literature-search-europepmc` | `science\skills\literature_search_europepmc\SKILL.md` | `4582fcc3fa36` | — |
| `literature-search-openalex` | `science\skills\literature_search_openalex\SKILL.md` | `61ae8d259829` | — |
| `ncbi-sequence-fetch` | `science\skills\ncbi_sequence_fetch\SKILL.md` | `9cda15b57873` | — |
| `openfda-database` | `science\skills\openfda_database\SKILL.md` | `f31e483d8713` | — |
| `opentargets-database` | `science\skills\opentargets_database\SKILL.md` | `06f42275cb2a` | — |
| `pdb-database` | `science\skills\pdb_database\SKILL.md` | `f17ca40aa072` | — |
| `predictingthepast` | `science\skills\predictingthepast\SKILL.md` | `07520c497a85` | — |
| `protein-sequence-msa` | `science\skills\protein_sequence_msa\SKILL.md` | `899c45684b07` | — |
| `protein-sequence-similarity-search` | `science\skills\protein_sequence_similarity_search\SKILL.md` | `489005b99c42` | — |
| `pubchem-database` | `science\skills\pubchem_database\SKILL.md` | `dfb7876a2da5` | — |
| `pubmed-database` | `science\skills\pubmed_database\SKILL.md` | `f1f4a89fb2b7` | — |
| `pymol` | `science\skills\pymol\SKILL.md` | `72bf6ae780d2` | — |
| `quickgo-database` | `science\skills\quickgo_database\SKILL.md` | `a835ba855337` | — |
| `reactome-database` | `science\skills\reactome_database\SKILL.md` | `bccfb05ac68a` | — |
| `string-database` | `science\skills\string_database\SKILL.md` | `6de0f5994327` | — |
| `ucsc-conservation-and-tfbs` | `science\skills\ucsc_conservation_and_tfbs\SKILL.md` | `c416b214ae56` | — |
| `unibind-database` | `science\skills\unibind_database\SKILL.md` | `779f16722e93` | — |
| `uniprot-database` | `science\skills\uniprot_database\SKILL.md` | `c430156a6826` | — |
| `uv` | `science\skills\uv\SKILL.md` | `d01562f2dcc1` | — |
| `workflow-skill-creator` | `science\skills\workflow_skill_creator\SKILL.md` | `4833b12e3bbe` | — |

### `C:\Users\asus\.gemini\antigravity-ide\plugins`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `create-security-implementation-plan` | `Google.securecoder.securecoder\skills\create_security_implementation_plan\SKILL.md` | `08a6a37b018e` | — |
| `determine-threat-model` | `Google.securecoder.securecoder\skills\determine_threat_model\SKILL.md` | `398db8fb589a` | — |
| `generate-security-audit-report` | `Google.securecoder.securecoder\skills\generate_security_audit_report\SKILL.md` | `4f3b4854bbaf` | — |
| `run-poc` | `Google.securecoder.securecoder\skills\run_poc\SKILL.md` | `463a9ee5acac` | — |
| `run-security-scanner` | `Google.securecoder.securecoder\skills\run_security_scanner\SKILL.md` | `a810e85c281e` | — |
| `scan_dependencies` | `Google.securecoder.securecoder\skills\scan_dependencies\SKILL.md` | `9b7d34b4b633` | — |
| `securecoder_generation` | `Google.securecoder.securecoder\skills\securecoder_generation\SKILL.md` | `2cbfa270513f` | — |
| `securecoder-persona` | `Google.securecoder.securecoder\skills\securecoder_persona\SKILL.md` | `e8a5e51c878e` | — |

### `C:\Users\asus\.codex\plugins\cache`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `computer-use` | `openai-bundled\computer-use\26.1103.60933\skills\computer-use\SKILL.md` | `8211e4b11a19` | — |
| `visualize` | `openai-bundled\visualize\1.0.84\skills\visualize\SKILL.md` | `a500fc502026` | — |
| `adobe-batch-edit-photos` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-batch-edit-photos\SKILL.md` | `062112a42434` | — |
| `adobe-create-mockups` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-create-mockups\SKILL.md` | `65a8fd58c849` | — |
| `adobe-create-social-variations` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-create-social-variations\SKILL.md` | `f2404147b9a0` | — |
| `adobe-design-from-template` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-design-from-template\SKILL.md` | `11d9eaed34c5` | — |
| `adobe-edit-quick-cut` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-edit-quick-cut\SKILL.md` | `252f8490412e` | — |
| `adobe-fonts` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-fonts\SKILL.md` | `09c39f6b0ac8` | — |
| `adobe-retouch-portraits` | `openai-curated-remote\app-69312da8e4dc81919370cb86fd172b6c\10.0.0\skills\adobe-retouch-portraits\SKILL.md` | `3b3d098547f0` | — |
| `ad-campaign` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\ad-campaign\SKILL.md` | `3c24def8344e` | — |
| `cinematic-shots` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\cinematic-shots\SKILL.md` | `d7edb9887bc9` | — |
| `consistent-characters` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\consistent-characters\SKILL.md` | `58d5052f338d` | — |
| `localize-video` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\localize-video\SKILL.md` | `beb51e93274f` | — |
| `magnific-essentials` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\magnific-essentials\SKILL.md` | `81d586432e44` | — |
| `precise-image-edits` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\precise-image-edits\SKILL.md` | `c7b901ec3fe3` | — |
| `previs-storyboard` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\previs-storyboard\SKILL.md` | `66515598c218` | — |
| `product-imagery` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\product-imagery\SKILL.md` | `df98440d9009` | — |
| `sound-and-voice` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\sound-and-voice\SKILL.md` | `62af3983ac5b` | — |
| `video-ad` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\video-ad\SKILL.md` | `6e870133c01f` | — |
| `video-finishing` | `openai-curated-remote\app-6a1f227d5a848191ae3317c66947b440\1.1.3\skills\video-finishing\SKILL.md` | `55aa30342ae3` | — |
| `analyze-data-quality` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\analyze-data-quality\SKILL.md` | `2a37a6522b95` | — |
| `answers-follow-up` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\answers-follow-up\SKILL.md` | `662d04f86a34` | — |
| `build-dashboard` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\build-dashboard\SKILL.md` | `c20134b9e2af` | — |
| `build-report` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\build-report\SKILL.md` | `f8d253d94374` | — |
| `convert-to-doc` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\convert-to-doc\SKILL.md` | `d3e03ae9f93b` | — |
| `convert-to-slides` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\convert-to-slides\SKILL.md` | `b6b37a9b4e3f` | — |
| `customize-data-plugin` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\customize-data-plugin\SKILL.md` | `00cb2d197529` | — |
| `design-kpis` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\design-kpis\SKILL.md` | `4976d5b6a108` | — |
| `index` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\index\SKILL.md` | `8be268581df3` | — |
| `jupyter-notebooks` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\jupyter-notebooks\SKILL.md` | `9afd4a356c34` | — |
| `kpi-reporting` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\kpi-reporting\SKILL.md` | `33e833ec528b` | — |
| `market-sizing` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\market-sizing\SKILL.md` | `09a44799a55f` | — |
| `metric-diagnostics` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\metric-diagnostics\SKILL.md` | `3598e71ae067` | — |
| `onboarding` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\onboarding\SKILL.md` | `9259af9805d9` | — |
| `product-business-analysis` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\product-business-analysis\SKILL.md` | `47f78f6191ee` | — |
| `publish-artifact-to-sites` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\publish-artifact-to-sites\SKILL.md` | `1b49f78cabf2` | — |
| `report-to-pdf` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\report-to-pdf\SKILL.md` | `2b0d0521d37c` | — |
| `schedule-refresh-jobs` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\schedule-refresh-jobs\SKILL.md` | `b590e4443e83` | — |
| `share-artifact-summary` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\share-artifact-summary\SKILL.md` | `c51a7a0f3f53` | — |
| `validate-data` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\validate-data\SKILL.md` | `bde264dbf2b0` | — |
| `visualize-data` | `openai-curated-remote\data-analytics\1.1.0-exp-baseline\skills\visualize-data\SKILL.md` | `03ac46a9920d` | — |
| `gsap` | `openai-curated-remote\hyperframes\0.1.2\skills\gsap\SKILL.md` | `730476ba02cc` | — |
| `hyperframes` | `openai-curated-remote\hyperframes\0.1.2\skills\hyperframes\SKILL.md` | `ce7dbbc9229a` | — |
| `hyperframes-cli` | `openai-curated-remote\hyperframes\0.1.2\skills\hyperframes-cli\SKILL.md` | `253ff75cd896` | — |
| `hyperframes-registry` | `openai-curated-remote\hyperframes\0.1.2\skills\hyperframes-registry\SKILL.md` | `0248bfb9968d` | — |
| `website-to-hyperframes` | `openai-curated-remote\hyperframes\0.1.2\skills\website-to-hyperframes\SKILL.md` | `482afa42349f` | — |
| `artifact-template-analytics-dashboard` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-analytics-dashboard\SKILL.md` | `cf5360fd8b19` | — |
| `artifact-template-business-review` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-business-review\SKILL.md` | `27721fc1d67d` | — |
| `artifact-template-design-report` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-design-report\SKILL.md` | `563722f53854` | — |
| `artifact-template-experiment-analysis` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-experiment-analysis\SKILL.md` | `0b05effc47df` | — |
| `artifact-template-financial-budget` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-financial-budget\SKILL.md` | `c0b6b7a62a15` | — |
| `artifact-template-investment-committee-memo` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-investment-committee-memo\SKILL.md` | `68abd08cfe5e` | — |
| `artifact-template-legal-memorandum` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-legal-memorandum\SKILL.md` | `51fb9d21baf6` | — |
| `artifact-template-market-trends-report` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-market-trends-report\SKILL.md` | `d58d019b89cb` | — |
| `artifact-template-minimal-letterhead` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-minimal-letterhead\SKILL.md` | `880ef094d4d0` | — |
| `artifact-template-operating-calendar` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-operating-calendar\SKILL.md` | `33bb660791a0` | — |
| `artifact-template-operating-review` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-operating-review\SKILL.md` | `6d63c5cd025f` | — |
| `artifact-template-project-kickoff` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-project-kickoff\SKILL.md` | `aa893ebd89e7` | — |
| `artifact-template-project-tracker` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-project-tracker\SKILL.md` | `d97d5be20189` | — |
| `artifact-template-sales-pipeline` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-sales-pipeline\SKILL.md` | `15cfeeedf440` | — |
| `artifact-template-simple-dark-mode` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-simple-dark-mode\SKILL.md` | `b7c8d0c05f75` | — |
| `artifact-template-simple-light-mode` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-simple-light-mode\SKILL.md` | `7c68430c6cf5` | — |
| `artifact-template-strategy-memorandum` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-strategy-memorandum\SKILL.md` | `51d7882ac94e` | — |
| `artifact-template-system-design` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-system-design\SKILL.md` | `87f7b7ed1b0d` | — |
| `artifact-template-team-alignment` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-team-alignment\SKILL.md` | `26d7cafdcd18` | — |
| `artifact-template-three-statement-forecast` | `openai-curated-remote\openai-templates\0.1.1\skills\artifact-template-three-statement-forecast\SKILL.md` | `74f4a5cccec0` | — |
| `plugin-management` | `openai-curated-remote\plugin-management\0.1.0\skills\plugin-management\SKILL.md` | `653841cc2120` | — |
| `sites` | `openai-curated-remote\sites\1.1.4\skills\sites\SKILL.md` | `f51bd813c224` | — |
| `sites-remix` | `openai-curated-remote\sites\1.1.4\skills\sites-remix\SKILL.md` | `34a249750d98` | — |
| `visualize` | `openai-curated-remote\visualize\1.0.89\skills\visualize\SKILL.md` | `4a24dd004e9a` | — |
| `create-pet` | `openai-curated-remote\work-pets\0.1.6\skills\create-pet\SKILL.md` | `841354fb8116` | — |
| `pets` | `openai-curated-remote\work-pets\0.1.6\skills\pets\SKILL.md` | `1bf5d45fd6a6` | — |
| `update-pet` | `openai-curated-remote\work-pets\0.1.6\skills\update-pet\SKILL.md` | `c63c98d67b6a` | — |
| `documents` | `openai-primary-runtime\documents\26.1105.12137\skills\documents\SKILL.md` | `e3e5486c9e9f` | — |
| `pdf` | `openai-primary-runtime\pdf\26.1105.12137\skills\pdf\SKILL.md` | `5e14b4b8f944` | — |
| `Presentations` | `openai-primary-runtime\presentations\26.1105.12137\skills\presentations\SKILL.md` | `97fedde4ba6c` | — |
| `excel-live-control` | `openai-primary-runtime\spreadsheets\26.1105.12137\skills\excel-live-control\SKILL.md` | `55335802aeb6` | — |
| `Spreadsheets` | `openai-primary-runtime\spreadsheets\26.1105.12137\skills\spreadsheets\SKILL.md` | `e7da45892e18` | — |
| `template-creator` | `openai-primary-runtime\template-creator\26.1105.12137\skills\template-creator\SKILL.md` | `244bfef01d3e` | — |

### `D:\GoogleAntigravity\LiloMediaWorkspace\.claude\skills`

| الاسم في الـmanifest | المسار النسبي | SHA-256 مختصر | وجهة الوصلة عند اختلافها |
|---|---|---|---|
| `build-dist` | `build-dist\SKILL.md` | `77b01b78f6b5` | — |
| `change-report` | `change-report\SKILL.md` | `1cf2ad519df2` | — |
