const SLOT_STORAGE_KEY = "tone:selected-slot";
const LANGUAGE_STORAGE_KEY = "tone:language";
const WRITE_TOKEN_STORAGE_KEY = "tone:write-token";
const DEFAULT_SELECTED_SLOT = 3;
const MAX_FLOW_ML_S = 8;
const DEFAULT_DURATION_SLIDER_MAX_S = 180;
const SUPPORTED_LANGUAGES = ["zh", "en", "ja"];

const messages = {
  zh: {
    "app.title": "TONE Coffee Brewer Recipe Lab",
    "top.machineStatus": "机器状态",
    "language.label": "界面语言",
    "language.short": "语言",
    "action.selectMachine": "选择 TONE 机器",
    "action.discoverTitle": "发现局域网 TONE 机器",
    "action.discover": "发现",
    "action.refreshTitle": "重新读取机器",
    "action.refresh": "刷新",
    "action.snapshotTitle": "保存当前机器快照",
    "action.snapshot": "快照",
    "slots.aria": "机器 slot",
    "slots.title": "机器 Slot",
    "slots.subtitle": "机器内保存的配方",
    "device.title": "设备",
    "device.subtitle": "当前目标",
    "device.host": "主机",
    "device.profile": "Profile",
    "device.slots": "Slot",
    "editor.aria": "配方编辑器",
    "metrics.aria": "配方摘要",
    "metrics.target": "目标",
    "metrics.time": "时间",
    "metrics.flow": "流量",
    "metrics.output": "出水",
    "metrics.points": "点位",
    "chart.title": "出水曲线",
    "chart.captionEmpty": "目标流量、累计出水和温度时间线",
    "chart.aria": "配方曲线",
    "chart.target": "目标",
    "legend.flow": "流量",
    "legend.cumulative": "累计",
    "legend.temp": "温度",
    "editor.name": "名称",
    "editor.type": "类型",
    "editor.targetMl": "目标 ml",
    "editor.beverage": "饮品",
    "beverage.coffee": "咖啡",
    "beverage.tea": "茶",
    "table.phase": "阶段",
    "table.duration": "时长 s",
    "table.durationDrag": "拖动调整时长",
    "table.flow": "流量 ml/s（最高 8）",
    "table.flowMax": "最高 8 ml/s",
    "table.temp": "温度 C",
    "table.end": "结束 s",
    "table.cumulative": "累计 ml",
    "right.aria": "检查面板",
    "write.title": "安全写入",
    "write.locked": "写入模式已锁定",
    "write.enabled": "写入模式已启用",
    "write.confirmLabel": "写入确认文本",
    "write.tokenLabel": "远程写入 Token",
    "write.tokenPlaceholder": "X-TONE-Write-Token",
    "write.tokenRequired": "远程写入需要服务器配置的 token。",
    "write.buttonTitle": "写入当前 slot",
    "write.hintLocked": "需要先用写入模式重启服务，再输入精确确认文本。",
    "write.hintEnabled": "输入 WRITE SLOT {slot}，系统会先创建新快照再写入。",
    "write.hintEnabledRemote": "输入 WRITE SLOT {slot}，并提供远程写入 token；系统会先创建新快照再写入。",
    "write.button": "写入 Slot {slot}",
    "write.stage.ready": "就绪",
    "write.stage.snapshot": "创建快照",
    "write.stage.write": "发送配方",
    "write.stage.verify": "确认回读",
    "write.stage.complete": "回读已验证",
    "write.stage.mismatch": "未通过验证",
    "write.stage.error": "写入已停止",
    "write.button.snapshot": "快照中",
    "write.button.write": "发送中",
    "write.button.verify": "确认中",
    "write.step.snapshot": "快照",
    "write.step.send": "发送",
    "write.step.confirm": "确认",
    "write.detail.idle": "没有正在进行的写入。",
    "write.detail.snapshot": "正在写入前读取 Slot {slot}。",
    "write.detail.sending": "正在把 {name} 发送到 Slot {slot}，随后会读取机器回写内容。",
    "write.detail.comparing": "正在比较 Slot {slot} 的回读内容。",
    "info.title": "机器信息",
    "info.subtitle": "参数",
    "info.refreshTitle": "重新读取机器参数",
    "info.paramsButton": "参数",
    "library.title": "库",
    "library.subtitle": "保存的配方",
    "library.saveTitle": "保存当前配方",
    "library.save": "保存",
    "library.loadTitle": "载入到编辑区",
    "library.rename": "重命名",
    "library.renameTitle": "重命名保存的配方",
    "library.renameLabel": "保存配方名称",
    "library.renamePlaceholder": "配方名称",
    "library.renameSave": "保存名称",
    "library.renameCancel": "取消",
    "library.renameEmpty": "配方名称不能为空。",
    "library.targetSlot": "目标",
    "library.write": "写入",
    "library.writeTitle": "把保存配方写入目标 slot",
    "library.writeConfirmLabel": "库配方写入确认文本",
    "library.writeConfirmHint": "输入 WRITE SLOT {slot} 后确认写入。",
    "library.writeConfirm": "确认写入",
    "library.writeCancel": "取消",
    "status.loading": "加载中",
    "status.reading": "读取中",
    "status.connected": "已连接",
    "status.writesEnabled": "写入已启用",
    "status.writesLocked": "写入已锁定",
    "machine.selected": "已选择",
    "machine.verified": "已验证",
    "machine.unverified": "未验证",
    "machine.none": "没有机器",
    "recipe.emptySlots": "没有配方 slot",
    "recipe.noSaved": "没有保存的配方",
    "recipe.empty": "空",
    "recipe.basic": "basic",
    "recipe.noRecipe": "没有配方",
    "recipe.untitled": "未命名",
    "recipe.slot": "Slot {slot}",
    "recipe.libraryToSlot": "库配方到 Slot {slot}",
    "recipe.card": "{type} · {volume} ml · {points} 个点位",
    "recipe.cardDetailed": "{type} · {volume} ml · {time} s · 估算 {total} ml",
    "recipe.savedCard": "{type} · {volume} ml · 保存于 {time}",
    "recipe.meta": "{type} · {volume} ml 目标 · {time} s · 估算 {total} ml",
    "recipe.outputAbove": "高于目标 {amount} ml",
    "recipe.outputBelow": "低于目标 {amount} ml",
    "chart.caption": "{points} 个点位 · 累计出水 {volume} ml",
    "chart.ariaDetailed": "{name} 的配方曲线：{points} 个点位，{time} 秒，累计出水 {volume} ml，目标 {target} ml。",
    "phase.none": "无",
    "phase.bloom": "焖蒸",
    "phase.turbulence": "扰流",
    "phase.extraction": "萃取",
    "parameters.empty": "没有参数",
    "parameters.emptyValue": "未设置",
    "table.pointPhase": "第 {point} 段阶段",
    "table.pointDuration": "第 {point} 段时长，秒",
    "table.pointDurationSlider": "拖动调整第 {point} 段时长",
    "table.pointFlow": "第 {point} 段流量，最高 8 ml/s",
    "table.pointTemp": "第 {point} 段温度，摄氏度",
    "toast.reading": "正在读取 TONE",
    "toast.refreshed": "已刷新",
    "toast.discovering": "正在发现",
    "toast.found": "找到 {count} 台",
    "toast.notFound": "没有发现机器",
    "toast.switching": "正在切换机器",
    "toast.machineSelected": "已选择机器",
    "toast.readingParams": "正在读取参数",
    "toast.paramsRefreshed": "参数已刷新",
    "toast.backupSaved": "快照已保存",
    "toast.savedLibrary": "已保存到库",
    "toast.renamedLibrary": "配方名称已更新",
    "toast.slotVerified": "Slot {slot} 已验证",
    "toast.slotNotVerified": "Slot {slot} 未通过验证",
    "operation.aria": "后台操作状态",
    "operation.idle": "就绪",
    "operation.idleDetail": "当前没有网络操作。",
    "operation.running": "进行中",
    "operation.complete": "完成",
    "operation.failed": "失败",
    "operation.init.title": "初始化 TONE 状态",
    "operation.init.status": "连接当前机器。",
    "operation.init.recipes": "读取当前配方和参数快照。",
    "operation.init.params": "刷新机器参数。",
    "operation.init.library": "同步本地配方库。",
    "operation.init.complete": "初始化完成。",
    "operation.refresh.title": "刷新 TONE 状态",
    "operation.refresh.current": "读取当前机器配方，这一步可能需要等待。",
    "operation.refresh.params": "读取机器参数。",
    "operation.refresh.library": "同步本地配方库。",
    "operation.refresh.complete": "刷新完成。",
    "operation.discover.title": "发现 TONE 机器",
    "operation.discover.detail": "正在扫描局域网，最多等待约 2 秒。",
    "operation.discover.complete": "找到 {count} 台机器。",
    "operation.discover.empty": "没有发现机器。",
    "operation.switch.title": "切换目标机器",
    "operation.switch.detail": "正在切换到 {machine}。",
    "operation.switch.current": "读取新机器的配方。",
    "operation.switch.params": "读取新机器参数。",
    "operation.switch.library": "同步本地配方库。",
    "operation.switch.complete": "机器切换完成。",
    "operation.params.title": "读取机器参数",
    "operation.params.detail": "正在刷新参数列表。",
    "operation.params.complete": "参数已刷新。",
    "operation.backup.title": "保存机器快照",
    "operation.backup.detail": "正在读取机器并写入本地快照。",
    "operation.backup.complete": "快照已保存。",
    "operation.library.title": "保存配方到库",
    "operation.library.detail": "正在保存当前编辑版本。",
    "operation.library.complete": "配方已保存到库。",
    "operation.libraryRename.title": "重命名保存的配方",
    "operation.libraryRename.detail": "正在更新库中的配方名称。",
    "operation.libraryRename.complete": "配方名称已更新。",
    "error.confirmation": "确认文本必须完全等于：{expected}",
    "verify.noData": "已写入 Slot {slot}，但没有返回验证数据。",
    "verify.ok": "Slot {slot} 回读验证通过，{points} 个点位与机器字段一致。",
    "verify.error": "已写入 Slot {slot}，但回读失败：{error}",
    "verify.notVerified": "已写入 Slot {slot}，但回读未通过验证。",
    "verify.mismatch": "已写入 Slot {slot}，但回读不一致（{count} 项）。{field}：预期 {expected}，实际 {actual}。"
  },
  en: {
    "app.title": "TONE Coffee Brewer Recipe Lab",
    "top.machineStatus": "Machine status",
    "language.label": "Interface language",
    "language.short": "Lang",
    "action.selectMachine": "Select TONE Coffee Brewer",
    "action.discoverTitle": "Discover TONE Coffee Brewers on the LAN",
    "action.discover": "Discover",
    "action.refreshTitle": "Read the machine again",
    "action.refresh": "Refresh",
    "action.snapshotTitle": "Save a current machine snapshot",
    "action.snapshot": "Snapshot",
    "slots.aria": "machine slots",
    "slots.title": "Machine Slots",
    "slots.subtitle": "Stored recipes",
    "device.title": "Device",
    "device.subtitle": "Current target",
    "device.host": "Host",
    "device.profile": "Profile",
    "device.slots": "Slots",
    "editor.aria": "recipe editor",
    "metrics.aria": "recipe summary",
    "metrics.target": "Target",
    "metrics.time": "Time",
    "metrics.flow": "Flow",
    "metrics.output": "Output",
    "metrics.points": "Points",
    "chart.title": "Flow Curve",
    "chart.captionEmpty": "Target flow, cumulative output, and temperature timeline",
    "chart.aria": "recipe curve",
    "chart.target": "target",
    "legend.flow": "Flow",
    "legend.cumulative": "Cumulative",
    "legend.temp": "Temp",
    "editor.name": "Name",
    "editor.type": "Type",
    "editor.targetMl": "Target ml",
    "editor.beverage": "Beverage",
    "beverage.coffee": "coffee",
    "beverage.tea": "tea",
    "table.phase": "Phase",
    "table.duration": "Duration s",
    "table.durationDrag": "Drag to adjust duration",
    "table.flow": "Flow ml/s (max 8)",
    "table.flowMax": "max 8 ml/s",
    "table.temp": "Temp C",
    "table.end": "End s",
    "table.cumulative": "Cumulative ml",
    "right.aria": "inspector",
    "write.title": "Guarded Write",
    "write.locked": "Write mode is locked",
    "write.enabled": "Write mode is enabled",
    "write.confirmLabel": "Write confirmation text",
    "write.tokenLabel": "Remote write token",
    "write.tokenPlaceholder": "X-TONE-Write-Token",
    "write.tokenRequired": "Remote writes require the server write token.",
    "write.buttonTitle": "Write the current slot",
    "write.hintLocked": "Enable writes on the server, then enter the exact confirmation text.",
    "write.hintEnabled": "Enter WRITE SLOT {slot} to send this recipe after a fresh snapshot.",
    "write.hintEnabledRemote": "Enter WRITE SLOT {slot} and the remote write token. A fresh snapshot is created before sending.",
    "write.button": "Write Slot {slot}",
    "write.stage.ready": "Ready",
    "write.stage.snapshot": "Taking snapshot",
    "write.stage.write": "Sending recipe",
    "write.stage.verify": "Confirming readback",
    "write.stage.complete": "Readback verified",
    "write.stage.mismatch": "Not verified",
    "write.stage.error": "Write stopped",
    "write.button.snapshot": "Snapshotting",
    "write.button.write": "Sending",
    "write.button.verify": "Confirming",
    "write.step.snapshot": "Snapshot",
    "write.step.send": "Send",
    "write.step.confirm": "Confirm",
    "write.detail.idle": "No write in progress.",
    "write.detail.snapshot": "Reading Slot {slot} before writing.",
    "write.detail.sending": "Sending {name} to Slot {slot}, then reading it back.",
    "write.detail.comparing": "Comparing readback for Slot {slot}.",
    "info.title": "Machine Info",
    "info.subtitle": "Parameters",
    "info.refreshTitle": "Read machine parameters again",
    "info.paramsButton": "Params",
    "library.title": "Library",
    "library.subtitle": "Saved recipes",
    "library.saveTitle": "Save the current recipe",
    "library.save": "Save",
    "library.loadTitle": "Load into editor",
    "library.rename": "Rename",
    "library.renameTitle": "Rename saved recipe",
    "library.renameLabel": "Saved recipe name",
    "library.renamePlaceholder": "Recipe name",
    "library.renameSave": "Save Name",
    "library.renameCancel": "Cancel",
    "library.renameEmpty": "Recipe name cannot be empty.",
    "library.targetSlot": "Target",
    "library.write": "Write",
    "library.writeTitle": "Write this saved recipe to the target slot",
    "library.writeConfirmLabel": "Library recipe write confirmation text",
    "library.writeConfirmHint": "Enter WRITE SLOT {slot} to confirm.",
    "library.writeConfirm": "Confirm Write",
    "library.writeCancel": "Cancel",
    "status.loading": "Loading",
    "status.reading": "Reading",
    "status.connected": "Connected",
    "status.writesEnabled": "Writes enabled",
    "status.writesLocked": "Writes locked",
    "machine.selected": "Selected",
    "machine.verified": "verified",
    "machine.unverified": "unverified",
    "machine.none": "No machine",
    "recipe.emptySlots": "No recipe slots",
    "recipe.noSaved": "No saved recipes",
    "recipe.empty": "Empty",
    "recipe.basic": "basic",
    "recipe.noRecipe": "No recipe",
    "recipe.untitled": "Untitled",
    "recipe.slot": "Slot {slot}",
    "recipe.libraryToSlot": "Library to Slot {slot}",
    "recipe.card": "{type} · {volume} ml · {points} points",
    "recipe.cardDetailed": "{type} · {volume} ml · {time} s · est. {total} ml",
    "recipe.savedCard": "{type} · {volume} ml · saved {time}",
    "recipe.meta": "{type} · {volume} ml target · {time} s · estimated {total} ml",
    "recipe.outputAbove": "{amount} ml above target",
    "recipe.outputBelow": "{amount} ml below target",
    "chart.caption": "{points} points · {volume} ml cumulative output",
    "chart.ariaDetailed": "Recipe curve for {name}: {points} points, {time} seconds, {volume} ml cumulative output, {target} ml target.",
    "phase.none": "none",
    "phase.bloom": "bloom",
    "phase.turbulence": "turbulence",
    "phase.extraction": "extraction",
    "parameters.empty": "No parameters",
    "parameters.emptyValue": "Not set",
    "table.pointPhase": "Point {point} phase",
    "table.pointDuration": "Point {point} duration in seconds",
    "table.pointDurationSlider": "Drag to adjust point {point} duration",
    "table.pointFlow": "Point {point} flow, max 8 ml/s",
    "table.pointTemp": "Point {point} temperature in Celsius",
    "toast.reading": "Reading TONE",
    "toast.refreshed": "Refreshed",
    "toast.discovering": "Discovering",
    "toast.found": "Found {count}",
    "toast.notFound": "No machine found",
    "toast.switching": "Switching machine",
    "toast.machineSelected": "Machine selected",
    "toast.readingParams": "Reading parameters",
    "toast.paramsRefreshed": "Parameters refreshed",
    "toast.backupSaved": "Backup saved",
    "toast.savedLibrary": "Saved to library",
    "toast.renamedLibrary": "Recipe name updated",
    "toast.slotVerified": "Slot {slot} verified",
    "toast.slotNotVerified": "Slot {slot} not verified",
    "operation.aria": "background operation status",
    "operation.idle": "Ready",
    "operation.idleDetail": "No network operation running.",
    "operation.running": "Running",
    "operation.complete": "Complete",
    "operation.failed": "Failed",
    "operation.init.title": "Initializing TONE state",
    "operation.init.status": "Connecting to the current machine.",
    "operation.init.recipes": "Reading current recipes and parameter snapshot.",
    "operation.init.params": "Refreshing machine parameters.",
    "operation.init.library": "Syncing the local recipe library.",
    "operation.init.complete": "Initialization complete.",
    "operation.refresh.title": "Refreshing TONE state",
    "operation.refresh.current": "Reading current machine recipes. This step can take a moment.",
    "operation.refresh.params": "Reading machine parameters.",
    "operation.refresh.library": "Syncing the local recipe library.",
    "operation.refresh.complete": "Refresh complete.",
    "operation.discover.title": "Discovering TONE Coffee Brewers",
    "operation.discover.detail": "Scanning the LAN, up to about 2 seconds.",
    "operation.discover.complete": "Found {count} machine(s).",
    "operation.discover.empty": "No machine found.",
    "operation.switch.title": "Switching target machine",
    "operation.switch.detail": "Switching to {machine}.",
    "operation.switch.current": "Reading recipes from the new machine.",
    "operation.switch.params": "Reading new machine parameters.",
    "operation.switch.library": "Syncing the local recipe library.",
    "operation.switch.complete": "Machine switch complete.",
    "operation.params.title": "Reading machine parameters",
    "operation.params.detail": "Refreshing the parameter list.",
    "operation.params.complete": "Parameters refreshed.",
    "operation.backup.title": "Saving machine snapshot",
    "operation.backup.detail": "Reading the machine and writing a local snapshot.",
    "operation.backup.complete": "Snapshot saved.",
    "operation.library.title": "Saving recipe to library",
    "operation.library.detail": "Saving the current edited version.",
    "operation.library.complete": "Recipe saved to library.",
    "operation.libraryRename.title": "Renaming saved recipe",
    "operation.libraryRename.detail": "Updating the recipe name in the library.",
    "operation.libraryRename.complete": "Recipe name updated.",
    "error.confirmation": "confirmation must be exactly: {expected}",
    "verify.noData": "Write sent to Slot {slot}, but verification data was not returned.",
    "verify.ok": "Readback verified from Slot {slot}. {points} points match the machine fields.",
    "verify.error": "Write sent to Slot {slot}, but readback failed: {error}",
    "verify.notVerified": "Write sent to Slot {slot}, but readback was not verified.",
    "verify.mismatch": "Write sent to Slot {slot}, but readback mismatch ({count}). {field}: expected {expected}, got {actual}."
  },
  ja: {
    "app.title": "TONE Coffee Brewer Recipe Lab",
    "top.machineStatus": "マシン状態",
    "language.label": "表示言語",
    "language.short": "言語",
    "action.selectMachine": "TONE マシンを選択",
    "action.discoverTitle": "LAN 内の TONE マシンを検出",
    "action.discover": "検出",
    "action.refreshTitle": "マシンを再読み込み",
    "action.refresh": "更新",
    "action.snapshotTitle": "現在のマシンスナップショットを保存",
    "action.snapshot": "スナップショット",
    "slots.aria": "マシン slot",
    "slots.title": "マシン Slot",
    "slots.subtitle": "保存済みレシピ",
    "device.title": "デバイス",
    "device.subtitle": "現在の対象",
    "device.host": "ホスト",
    "device.profile": "Profile",
    "device.slots": "Slot",
    "editor.aria": "レシピエディタ",
    "metrics.aria": "レシピ概要",
    "metrics.target": "目標",
    "metrics.time": "時間",
    "metrics.flow": "流量",
    "metrics.output": "抽出量",
    "metrics.points": "点数",
    "chart.title": "流量カーブ",
    "chart.captionEmpty": "目標流量、累積抽出量、温度のタイムライン",
    "chart.aria": "レシピカーブ",
    "chart.target": "目標",
    "legend.flow": "流量",
    "legend.cumulative": "累積",
    "legend.temp": "温度",
    "editor.name": "名前",
    "editor.type": "タイプ",
    "editor.targetMl": "目標 ml",
    "editor.beverage": "飲み物",
    "beverage.coffee": "コーヒー",
    "beverage.tea": "お茶",
    "table.phase": "フェーズ",
    "table.duration": "時間 s",
    "table.durationDrag": "ドラッグして時間を調整",
    "table.flow": "流量 ml/s（最大 8）",
    "table.flowMax": "最大 8 ml/s",
    "table.temp": "温度 C",
    "table.end": "終了 s",
    "table.cumulative": "累積 ml",
    "right.aria": "インスペクタ",
    "write.title": "保護付き書き込み",
    "write.locked": "書き込みモードはロック中",
    "write.enabled": "書き込みモードは有効",
    "write.confirmLabel": "書き込み確認テキスト",
    "write.tokenLabel": "リモート書き込みトークン",
    "write.tokenPlaceholder": "X-TONE-Write-Token",
    "write.tokenRequired": "リモート書き込みにはサーバーの書き込みトークンが必要です。",
    "write.buttonTitle": "現在の slot に書き込み",
    "write.hintLocked": "サーバーで書き込みを有効にしてから、正確な確認テキストを入力します。",
    "write.hintEnabled": "WRITE SLOT {slot} を入力すると、新しいスナップショット作成後に送信します。",
    "write.hintEnabledRemote": "WRITE SLOT {slot} とリモート書き込みトークンを入力します。送信前に新しいスナップショットを作成します。",
    "write.button": "Slot {slot} に書き込み",
    "write.stage.ready": "準備完了",
    "write.stage.snapshot": "スナップショット作成中",
    "write.stage.write": "レシピ送信中",
    "write.stage.verify": "読み戻し確認中",
    "write.stage.complete": "読み戻し確認済み",
    "write.stage.mismatch": "未確認",
    "write.stage.error": "書き込み停止",
    "write.button.snapshot": "保存中",
    "write.button.write": "送信中",
    "write.button.verify": "確認中",
    "write.step.snapshot": "スナップショット",
    "write.step.send": "送信",
    "write.step.confirm": "確認",
    "write.detail.idle": "進行中の書き込みはありません。",
    "write.detail.snapshot": "書き込み前に Slot {slot} を読み込んでいます。",
    "write.detail.sending": "{name} を Slot {slot} に送信し、その後読み戻します。",
    "write.detail.comparing": "Slot {slot} の読み戻しを比較しています。",
    "info.title": "マシン情報",
    "info.subtitle": "パラメータ",
    "info.refreshTitle": "マシンパラメータを再読み込み",
    "info.paramsButton": "パラメータ",
    "library.title": "ライブラリ",
    "library.subtitle": "保存済みレシピ",
    "library.saveTitle": "現在のレシピを保存",
    "library.save": "保存",
    "library.loadTitle": "エディタに読み込み",
    "library.rename": "名前変更",
    "library.renameTitle": "保存済みレシピの名前を変更",
    "library.renameLabel": "保存済みレシピ名",
    "library.renamePlaceholder": "レシピ名",
    "library.renameSave": "名前を保存",
    "library.renameCancel": "キャンセル",
    "library.renameEmpty": "レシピ名は空にできません。",
    "library.targetSlot": "対象",
    "library.write": "書き込み",
    "library.writeTitle": "保存済みレシピを対象 slot に書き込み",
    "library.writeConfirmLabel": "ライブラリレシピの書き込み確認テキスト",
    "library.writeConfirmHint": "WRITE SLOT {slot} を入力して確認します。",
    "library.writeConfirm": "書き込み確認",
    "library.writeCancel": "キャンセル",
    "status.loading": "読み込み中",
    "status.reading": "読み取り中",
    "status.connected": "接続済み",
    "status.writesEnabled": "書き込み有効",
    "status.writesLocked": "書き込みロック中",
    "machine.selected": "選択中",
    "machine.verified": "確認済み",
    "machine.unverified": "未確認",
    "machine.none": "マシンなし",
    "recipe.emptySlots": "レシピ slot がありません",
    "recipe.noSaved": "保存済みレシピなし",
    "recipe.empty": "空",
    "recipe.basic": "basic",
    "recipe.noRecipe": "レシピなし",
    "recipe.untitled": "無題",
    "recipe.slot": "Slot {slot}",
    "recipe.libraryToSlot": "ライブラリから Slot {slot}",
    "recipe.card": "{type} · {volume} ml · {points} 点",
    "recipe.cardDetailed": "{type} · {volume} ml · {time} s · 推定 {total} ml",
    "recipe.savedCard": "{type} · {volume} ml · 保存 {time}",
    "recipe.meta": "{type} · 目標 {volume} ml · {time} s · 推定 {total} ml",
    "recipe.outputAbove": "目標より {amount} ml 多い",
    "recipe.outputBelow": "目標より {amount} ml 少ない",
    "chart.caption": "{points} 点 · 累積抽出量 {volume} ml",
    "chart.ariaDetailed": "{name} のレシピカーブ：{points} 点、{time} 秒、累積抽出量 {volume} ml、目標 {target} ml。",
    "phase.none": "なし",
    "phase.bloom": "ブルーム",
    "phase.turbulence": "タービュランス",
    "phase.extraction": "抽出",
    "parameters.empty": "パラメータなし",
    "parameters.emptyValue": "未設定",
    "table.pointPhase": "{point} 番目のフェーズ",
    "table.pointDuration": "{point} 番目の時間（秒）",
    "table.pointDurationSlider": "{point} 番目の時間をドラッグで調整",
    "table.pointFlow": "{point} 番目の流量、最大 8 ml/s",
    "table.pointTemp": "{point} 番目の温度（摂氏）",
    "toast.reading": "TONE を読み取り中",
    "toast.refreshed": "更新しました",
    "toast.discovering": "検出中",
    "toast.found": "{count} 台見つかりました",
    "toast.notFound": "マシンが見つかりません",
    "toast.switching": "マシンを切り替え中",
    "toast.machineSelected": "マシンを選択しました",
    "toast.readingParams": "パラメータを読み取り中",
    "toast.paramsRefreshed": "パラメータを更新しました",
    "toast.backupSaved": "スナップショットを保存しました",
    "toast.savedLibrary": "ライブラリに保存しました",
    "toast.renamedLibrary": "レシピ名を更新しました",
    "toast.slotVerified": "Slot {slot} を確認しました",
    "toast.slotNotVerified": "Slot {slot} は確認できません",
    "operation.aria": "バックグラウンド操作の状態",
    "operation.idle": "準備完了",
    "operation.idleDetail": "実行中のネットワーク操作はありません。",
    "operation.running": "実行中",
    "operation.complete": "完了",
    "operation.failed": "失敗",
    "operation.init.title": "TONE 状態を初期化中",
    "operation.init.status": "現在のマシンに接続しています。",
    "operation.init.recipes": "現在のレシピとパラメータスナップショットを読み込んでいます。",
    "operation.init.params": "マシンパラメータを更新しています。",
    "operation.init.library": "ローカルレシピライブラリを同期しています。",
    "operation.init.complete": "初期化が完了しました。",
    "operation.refresh.title": "TONE 状態を更新中",
    "operation.refresh.current": "現在のマシンレシピを読み込んでいます。この手順は少し時間がかかります。",
    "operation.refresh.params": "マシンパラメータを読み込んでいます。",
    "operation.refresh.library": "ローカルレシピライブラリを同期しています。",
    "operation.refresh.complete": "更新が完了しました。",
    "operation.discover.title": "TONE マシンを検出中",
    "operation.discover.detail": "LAN をスキャンしています。最大約 2 秒待ちます。",
    "operation.discover.complete": "{count} 台のマシンが見つかりました。",
    "operation.discover.empty": "マシンが見つかりません。",
    "operation.switch.title": "対象マシンを切り替え中",
    "operation.switch.detail": "{machine} に切り替えています。",
    "operation.switch.current": "新しいマシンのレシピを読み込んでいます。",
    "operation.switch.params": "新しいマシンのパラメータを読み込んでいます。",
    "operation.switch.library": "ローカルレシピライブラリを同期しています。",
    "operation.switch.complete": "マシン切り替えが完了しました。",
    "operation.params.title": "マシンパラメータを読み込み中",
    "operation.params.detail": "パラメータリストを更新しています。",
    "operation.params.complete": "パラメータを更新しました。",
    "operation.backup.title": "マシンスナップショットを保存中",
    "operation.backup.detail": "マシンを読み取り、ローカルスナップショットを書き込んでいます。",
    "operation.backup.complete": "スナップショットを保存しました。",
    "operation.library.title": "レシピをライブラリに保存中",
    "operation.library.detail": "現在の編集バージョンを保存しています。",
    "operation.library.complete": "レシピをライブラリに保存しました。",
    "operation.libraryRename.title": "保存済みレシピの名前を変更中",
    "operation.libraryRename.detail": "ライブラリ内のレシピ名を更新しています。",
    "operation.libraryRename.complete": "レシピ名を更新しました。",
    "error.confirmation": "確認テキストは完全に一致する必要があります：{expected}",
    "verify.noData": "Slot {slot} に書き込みましたが、検証データが返りませんでした。",
    "verify.ok": "Slot {slot} の読み戻し確認が完了しました。{points} 点がマシンフィールドと一致しています。",
    "verify.error": "Slot {slot} に書き込みましたが、読み戻しに失敗しました：{error}",
    "verify.notVerified": "Slot {slot} に書き込みましたが、読み戻しを確認できませんでした。",
    "verify.mismatch": "Slot {slot} に書き込みましたが、読み戻しが一致しません（{count} 件）。{field}：期待 {expected}、実際 {actual}。"
  }
};

const languageHtmlMap = {
  zh: "zh-CN",
  en: "en",
  ja: "ja"
};

function normalizeLanguage(value) {
  const language = String(value || "").toLowerCase();
  if (language.startsWith("zh")) return "zh";
  if (language.startsWith("ja")) return "ja";
  if (language.startsWith("en")) return "en";
  return "en";
}

function readStoredLanguage() {
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(value)) return value;
  } catch {
    // Storage can be unavailable in locked-down browser contexts.
  }
  return normalizeLanguage(window.navigator.language);
}

const initialLanguage = readStoredLanguage();
let currentLanguage = initialLanguage;

function activeLanguage() {
  return currentLanguage;
}

function hasMessage(key, language = activeLanguage()) {
  return Object.prototype.hasOwnProperty.call(messages[language] || {}, key)
    || Object.prototype.hasOwnProperty.call(messages.en, key);
}

function t(key, vars = {}) {
  const language = activeLanguage();
  const table = messages[language] || messages.en;
  const value = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : messages.en[key];
  if (typeof value === "function") return value(vars);
  if (typeof value !== "string") return key;
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => String(vars[name] ?? ""));
}

function storeLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable in locked-down browser contexts.
  }
}

function readStoredSlot() {
  try {
    const value = Number(window.localStorage.getItem(SLOT_STORAGE_KEY));
    return Number.isInteger(value) && value >= 0 && value <= 3 ? value : DEFAULT_SELECTED_SLOT;
  } catch {
    return DEFAULT_SELECTED_SLOT;
  }
}

function storeSlot(slot) {
  try {
    window.localStorage.setItem(SLOT_STORAGE_KEY, String(slot));
  } catch {
    // Storage can be unavailable in locked-down browser contexts.
  }
}

function readStoredWriteToken() {
  try {
    return window.sessionStorage.getItem(WRITE_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeWriteToken(token) {
  try {
    window.sessionStorage.setItem(WRITE_TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage can be unavailable in locked-down browser contexts.
  }
}

function writeTokenRequired() {
  return Boolean(state.status?.remote_write_token_required);
}

function currentWriteToken() {
  return $("writeTokenInput")?.value || "";
}

const state = {
  language: initialLanguage,
  status: null,
  machines: [],
  parameters: [],
  backup: null,
  library: [],
  selectedSlot: readStoredSlot(),
  selectedRecipe: null,
  selectedLibraryId: null,
  libraryRename: {
    id: null,
    name: "",
  },
  libraryWrite: {
    id: null,
    slot: readStoredSlot(),
    confirmation: "",
    confirming: false,
  },
  operation: {
    active: false,
    status: "idle",
    titleKey: "operation.idle",
    detailKey: "operation.idleDetail",
    detail: "",
    vars: {},
    progress: 0,
    startedAt: null,
    finishedAt: null,
  },
  write: {
    active: false,
    stage: "idle",
    detail: "",
    detailKey: "write.detail.idle",
    detailVars: {},
    startedAt: null,
    finishedAt: null,
    lastActiveStage: null,
    backupId: null,
    writeId: null,
  },
};

const phases = [
  { value: 0, key: "none", label: "none", color: "oklch(70% 0.02 200)" },
  { value: 1, key: "bloom", label: "bloom", color: "oklch(50% 0.105 155)" },
  { value: 2, key: "turbulence", label: "turbulence", color: "oklch(52% 0.075 235)" },
  { value: 3, key: "extraction", label: "extraction", color: "oklch(62% 0.11 64)" },
];

const writeStageMeta = {
  idle: { labelKey: "write.stage.ready", progress: 0, buttonKey: null },
  snapshot: { labelKey: "write.stage.snapshot", progress: 32, buttonKey: "write.button.snapshot" },
  write: { labelKey: "write.stage.write", progress: 66, buttonKey: "write.button.write" },
  verify: { labelKey: "write.stage.verify", progress: 88, buttonKey: "write.button.verify" },
  complete: { labelKey: "write.stage.complete", progress: 100, buttonKey: null },
  mismatch: { labelKey: "write.stage.mismatch", progress: 100, buttonKey: null },
  error: { labelKey: "write.stage.error", progress: 100, buttonKey: null },
};

let writeClock = null;
let operationClock = null;
let operationHideTimer = null;

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const node = $(id);
  if (node) node.textContent = value;
}

function setAttrFromI18n(selector, attribute, dataAttribute) {
  document.querySelectorAll(selector).forEach((node) => {
    node.setAttribute(attribute, t(node.dataset[dataAttribute]));
  });
}

function applyStaticI18n() {
  currentLanguage = state.language;
  document.documentElement.lang = languageHtmlMap[state.language] || "en";
  document.title = t("app.title");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  setAttrFromI18n("[data-i18n-title]", "title", "i18nTitle");
  setAttrFromI18n("[data-i18n-placeholder]", "placeholder", "i18nPlaceholder");
  setAttrFromI18n("[data-i18n-aria-label]", "aria-label", "i18nAriaLabel");
  const languageSelect = $("languageSelect");
  if (languageSelect) languageSelect.value = state.language;
}

function setLanguage(language) {
  const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : "en";
  if (state.language === nextLanguage) return;
  state.language = nextLanguage;
  currentLanguage = nextLanguage;
  storeLanguage(nextLanguage);
  renderAll();
}

function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2600);
}

function operationElapsed() {
  if (!state.operation.startedAt) return "0.0s";
  const end = state.operation.finishedAt || performance.now();
  return formatSeconds(end - state.operation.startedAt);
}

function startOperationClock() {
  if (operationClock) return;
  operationClock = setInterval(renderOperationStatus, 250);
}

function stopOperationClock() {
  if (!operationClock) return;
  clearInterval(operationClock);
  operationClock = null;
}

function scheduleOperationIdle() {
  clearTimeout(operationHideTimer);
  operationHideTimer = setTimeout(() => {
    state.operation = {
      active: false,
      status: "idle",
      titleKey: "operation.idle",
      detailKey: "operation.idleDetail",
      detail: "",
      vars: {},
      progress: 0,
      startedAt: null,
      finishedAt: null,
    };
    renderOperationStatus();
    renderHeader();
  }, 3600);
}

function startOperation(titleKey, detailKey, vars = {}, progress = 8) {
  clearTimeout(operationHideTimer);
  state.operation = {
    active: true,
    status: "active",
    titleKey,
    detailKey,
    detail: "",
    vars,
    progress,
    startedAt: performance.now(),
    finishedAt: null,
  };
  startOperationClock();
  renderOperationStatus();
  renderHeader();
}

function updateOperation(detailKey, vars = {}, progress = state.operation.progress) {
  if (!state.operation.startedAt) return;
  state.operation = {
    ...state.operation,
    detailKey,
    detail: "",
    vars,
    progress: Math.max(state.operation.progress, progress),
  };
  renderOperationStatus();
}

function completeOperation(detailKey, vars = {}) {
  state.operation = {
    ...state.operation,
    active: false,
    status: "complete",
    detailKey,
    detail: "",
    vars,
    progress: 100,
    finishedAt: performance.now(),
  };
  stopOperationClock();
  renderOperationStatus();
  renderHeader();
  scheduleOperationIdle();
}

function failOperation(message) {
  state.operation = {
    ...state.operation,
    active: false,
    status: "error",
    detailKey: null,
    detail: message,
    progress: 100,
    finishedAt: performance.now(),
  };
  stopOperationClock();
  renderOperationStatus();
  renderHeader();
  scheduleOperationIdle();
}

function renderActionStates() {
  const busy = Boolean(state.operation.active || state.write.active);
  const actions = [
    "discoverButton",
    "refreshButton",
    "backupButton",
    "refreshParamsButton",
    "saveLibraryButton",
  ];
  actions.forEach((id) => {
    const node = $(id);
    if (!node) return;
    const disabledByState = id === "saveLibraryButton" && !state.selectedRecipe;
    node.disabled = busy || disabledByState;
    node.classList.toggle("busy", busy);
    node.setAttribute("aria-busy", busy ? "true" : "false");
  });
  const machineSelect = $("machineSelect");
  if (machineSelect) machineSelect.disabled = busy || !state.machines.length;
  document.querySelectorAll(".library-rename-button, .library-rename-save, .library-rename-cancel, .library-rename-input, .library-slot-select, .library-write-button, .library-write-input, .library-write-confirm-button, .library-write-cancel").forEach((node) => {
    node.disabled = busy;
  });
}

function renderOperationStatus() {
  const box = $("operationStatus");
  if (!box) return;
  const operation = state.operation;
  const elapsedMs = operation.startedAt ? (operation.finishedAt || performance.now()) - operation.startedAt : 0;
  const optimisticProgress = operation.active
    ? Math.min(92, Math.max(operation.progress, operation.progress + elapsedMs / 1000 * 1.8))
    : operation.progress;
  box.className = `operation-status ${operation.status}`;
  setText(
    "operationKicker",
    operation.status === "active"
      ? t("operation.running")
      : operation.status === "complete"
        ? t("operation.complete")
        : operation.status === "error"
          ? t("operation.failed")
          : t("operation.idle")
  );
  setText("operationTitle", t(operation.titleKey || "operation.idle", operation.vars));
  setText("operationDetail", operation.detailKey ? t(operation.detailKey, operation.vars) : operation.detail);
  setText("operationElapsed", operationElapsed());
  $("operationBar").style.width = `${Math.round(optimisticProgress)}%`;
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const writePath = path.startsWith("/api/write-") || /^\/api\/library\/\d+\/write-slot$/.test(path);
  if (writePath && writeTokenRequired()) {
    headers["X-TONE-Write-Token"] = currentWriteToken();
  }
  const response = await fetch(path, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || response.statusText);
  return data;
}

function cloneRecipe(recipe) {
  return JSON.parse(JSON.stringify(recipe));
}

function formatSeconds(ms) {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}

function writeElapsed() {
  if (!state.write.startedAt) return "0.0s";
  const end = state.write.finishedAt || performance.now();
  return formatSeconds(end - state.write.startedAt);
}

function startWriteClock() {
  if (writeClock) return;
  writeClock = setInterval(renderWriteProgress, 250);
}

function stopWriteClock() {
  if (!writeClock) return;
  clearInterval(writeClock);
  writeClock = null;
}

function setWriteStage(stage, detail, extra = {}, detailVars = {}) {
  const active = !["idle", "complete", "mismatch", "error"].includes(stage);
  const now = performance.now();
  const startedAt = stage === "idle"
    ? null
    : active
      ? (state.write.active && state.write.startedAt ? state.write.startedAt : now)
      : (state.write.startedAt || now);
  const detailKey = hasMessage(detail) ? detail : null;
  state.write = {
    ...state.write,
    ...extra,
    active,
    stage,
    detail: detailKey ? "" : detail,
    detailKey,
    detailVars,
    startedAt,
    finishedAt: active || stage === "idle" ? null : now,
    lastActiveStage: active ? stage : state.write.lastActiveStage,
  };
  if (active) startWriteClock();
  if (!active) stopWriteClock();
  renderWriteProgress();
  renderHeader();
}

function resetWriteStage() {
  state.write = {
    active: false,
    stage: "idle",
    detail: "",
    detailKey: "write.detail.idle",
    detailVars: {},
    startedAt: null,
    finishedAt: null,
    lastActiveStage: null,
    backupId: null,
    writeId: null,
  };
  stopWriteClock();
  renderWriteProgress();
  renderHeader();
}

function recipeTotal(recipe) {
  const last = recipe?.points?.[recipe.points.length - 1];
  return last ? last.estimated_cumulative_ml : 0;
}

function recipeTime(recipe) {
  const last = recipe?.points?.[recipe.points.length - 1];
  return last ? last.elapsed_end_s : 0;
}

function averageFlow(recipe) {
  const totalTime = recipeTime(recipe);
  if (!totalTime) return 0;
  return recipeTotal(recipe) / totalTime;
}

function machineKey(machine) {
  return `${machine.host}:${machine.port}`;
}

function currentTarget() {
  return state.status?.target || (state.status ? { host: state.status.host, port: state.status.port } : null);
}

function upsertMachine(machine) {
  if (!machine?.host || !machine?.port) return;
  const index = state.machines.findIndex((item) => machineKey(item) === machineKey(machine));
  if (index >= 0) {
    state.machines[index] = { ...state.machines[index], ...machine };
  } else {
    state.machines.push(machine);
  }
}

function machineLabel(machine) {
  const trust = machine.verified === false ? t("machine.unverified") : t("machine.verified");
  return `${machine.model || "TONE"} · ${machine.host}:${machine.port} · ${trust}`;
}

function selectRecipe(recipe, slot = recipe?.slot ?? 3, libraryId = null) {
  state.selectedSlot = slot;
  state.selectedRecipe = cloneRecipe(recipe);
  recomputeRecipe(state.selectedRecipe);
  state.selectedLibraryId = libraryId;
  if (libraryId === null) storeSlot(slot);
  renderAll();
}

function renderSlots() {
  const recipes = state.backup?.data?.recipes || [];
  if (!recipes.length) {
    $("slotList").innerHTML = `<div class="empty-panel">${t("recipe.emptySlots")}</div>`;
    return;
  }
  $("slotList").innerHTML = recipes
    .map((recipe) => {
      const active = state.selectedLibraryId === null && state.selectedSlot === recipe.slot;
      return `
        <button class="slot-card ${active ? "active" : ""}" data-slot="${recipe.slot}" aria-pressed="${active ? "true" : "false"}">
          <div class="tag-row">
            <span class="tag">${t("recipe.slot", { slot: recipe.slot + 1 })}</span>
          </div>
          <h3>${escapeHtml(recipe.name || t("recipe.empty"))}</h3>
          <p>${escapeHtml(t("recipe.cardDetailed", {
            type: recipe.recipe_type || t("recipe.basic"),
            volume: recipe.volume_ml,
            time: recipeTime(recipe).toFixed(1),
            total: recipeTotal(recipe).toFixed(1)
          }))}</p>
        </button>
      `;
    })
    .join("");
  document.querySelectorAll(".slot-card").forEach((node) => {
    node.addEventListener("click", () => {
      const slot = Number(node.dataset.slot);
      const recipe = recipes.find((item) => item.slot === slot);
      if (recipe) selectRecipe(recipe, slot, null);
    });
  });
}

function availableSlotIndexes(selectedSlot = state.selectedSlot) {
  const labels = state.status?.target?.slot_labels;
  const slots = Array.isArray(labels) && labels.length
    ? labels.map((label) => Number(label) - 1).filter((slot) => Number.isInteger(slot) && slot >= 0)
    : [0, 1, 2, 3];
  if (Number.isInteger(selectedSlot) && selectedSlot >= 0 && !slots.includes(selectedSlot)) {
    slots.unshift(selectedSlot);
  }
  return slots;
}

function slotOptionsHtml(selectedSlot) {
  const writableSlots = new Set(state.status?.writable_slots || []);
  const writeEnabled = Boolean(state.status?.write_enabled);
  return availableSlotIndexes(selectedSlot)
    .map((slot) => {
      const label = slot + 1;
      const disabled = writeEnabled && writableSlots.size && !writableSlots.has(slot);
      return `<option value="${slot}" ${slot === selectedSlot ? "selected" : ""} ${disabled ? "disabled" : ""}>Slot ${label}</option>`;
    })
    .join("");
}

function renderLibrary() {
  if (!state.library.length) {
    $("libraryList").innerHTML = `<div class="empty-panel">${t("recipe.noSaved")}</div>`;
    return;
  }
  const writableSlots = state.status?.writable_slots || [];
  const writeEnabled = Boolean(state.status?.write_enabled);
  const requiresWriteToken = writeTokenRequired();
  const missingWriteToken = requiresWriteToken && !currentWriteToken();
  const busy = state.operation.active || state.write.active;
  $("libraryList").innerHTML = state.library
    .map((item) => {
      const active = state.selectedLibraryId === item.id;
      const renaming = state.libraryRename.id === item.id;
      const writing = state.libraryWrite.id === item.id;
      const confirming = writing && state.libraryWrite.confirming;
      const targetSlot = writing ? state.libraryWrite.slot : state.selectedSlot;
      const targetSlotLabel = targetSlot + 1;
      const slotWritable = writableSlots.includes(targetSlot);
      const canWrite = writeEnabled && slotWritable && !missingWriteToken && !busy && !renaming;
      const recipe = item.recipe;
      return `
        <div class="library-item ${active ? "active" : ""} ${renaming ? "renaming" : ""} ${writing ? "writing" : ""}" data-id="${item.id}">
          <button class="library-card ${active ? "active" : ""}" data-id="${item.id}" aria-pressed="${active ? "true" : "false"}" title="${escapeHtml(t("library.loadTitle"))}" ${renaming || busy ? "disabled" : ""}>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(t("recipe.savedCard", {
              type: item.recipe_type || t("recipe.basic"),
              volume: recipe.volume_ml,
              time: item.updated_at
            }))}</p>
          </button>
          <button class="library-rename-button" data-id="${item.id}" title="${escapeHtml(t("library.renameTitle"))}" aria-label="${escapeHtml(t("library.renameTitle"))}" ${busy ? "disabled" : ""}>
            <span aria-hidden="true">✎</span>
            <span>${escapeHtml(t("library.rename"))}</span>
          </button>
          <div class="library-write-row">
            <label class="library-slot-target">
              <span>${escapeHtml(t("library.targetSlot"))}</span>
              <select class="library-slot-select" data-id="${item.id}" name="library_${item.id}_target_slot" autocomplete="off" ${busy || renaming ? "disabled" : ""}>
                ${slotOptionsHtml(targetSlot)}
              </select>
            </label>
            <button class="library-write-button primary" data-id="${item.id}" title="${escapeHtml(t("library.writeTitle"))}" ${canWrite ? "" : "disabled"}>
              ${escapeHtml(t("library.write"))} Slot ${targetSlotLabel}
            </button>
          </div>
          ${confirming ? `
            <form class="library-write-confirm" data-id="${item.id}">
              <label for="libraryWriteInput_${item.id}">
                <span>${escapeHtml(t("library.writeConfirmLabel"))}</span>
                <input id="libraryWriteInput_${item.id}" class="library-write-input" name="library_write_confirmation_${item.id}" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${escapeHtml(state.libraryWrite.confirmation)}" placeholder="WRITE SLOT ${targetSlotLabel}" ${busy ? "disabled" : ""}>
              </label>
              <p>${escapeHtml(t("library.writeConfirmHint", { slot: targetSlotLabel }))}</p>
              <div class="library-write-actions">
                <button class="library-write-confirm-button primary" type="submit" ${canWrite ? "" : "disabled"}>${escapeHtml(t("library.writeConfirm"))}</button>
                <button class="library-write-cancel" type="button" data-id="${item.id}" ${busy ? "disabled" : ""}>${escapeHtml(t("library.writeCancel"))}</button>
              </div>
            </form>
          ` : ""}
          ${renaming ? `
            <form class="library-rename-form" data-id="${item.id}">
              <label class="sr-only" for="libraryRenameInput_${item.id}">${escapeHtml(t("library.renameLabel"))}</label>
              <input id="libraryRenameInput_${item.id}" class="library-rename-input" name="library_recipe_name_${item.id}" autocomplete="off" spellcheck="false" value="${escapeHtml(state.libraryRename.name)}" placeholder="${escapeHtml(t("library.renamePlaceholder"))}">
              <div class="library-rename-actions">
                <button class="library-rename-save" type="submit">${escapeHtml(t("library.renameSave"))}</button>
                <button class="library-rename-cancel" type="button" data-id="${item.id}">${escapeHtml(t("library.renameCancel"))}</button>
              </div>
            </form>
          ` : ""}
        </div>
      `;
    })
    .join("");
  document.querySelectorAll(".library-card[data-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const id = Number(node.dataset.id);
      const item = state.library.find((entry) => entry.id === id);
      if (item) selectRecipe(item.recipe, state.selectedSlot, id);
    });
  });
  document.querySelectorAll(".library-rename-button[data-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const id = Number(node.dataset.id);
      startLibraryRename(id);
    });
  });
  document.querySelectorAll(".library-slot-select[data-id]").forEach((node) => {
    node.addEventListener("change", () => {
      const id = Number(node.dataset.id);
      const wasConfirming = state.libraryWrite.id === id && state.libraryWrite.confirming;
      startLibraryWrite(id, Number(node.value), wasConfirming);
    });
  });
  document.querySelectorAll(".library-write-button[data-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const id = Number(node.dataset.id);
      startLibraryWrite(id, state.libraryWrite.id === id ? state.libraryWrite.slot : state.selectedSlot, true);
    });
  });
  document.querySelectorAll(".library-write-cancel[data-id]").forEach((node) => {
    node.addEventListener("click", cancelLibraryWrite);
  });
  document.querySelectorAll(".library-write-confirm[data-id]").forEach((node) => {
    node.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = Number(node.dataset.id);
      const input = node.querySelector(".library-write-input");
      await submitLibraryWrite(id, input?.value || "");
    });
  });
  document.querySelectorAll(".library-rename-cancel[data-id]").forEach((node) => {
    node.addEventListener("click", cancelLibraryRename);
  });
  document.querySelectorAll(".library-rename-form[data-id]").forEach((node) => {
    node.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = Number(node.dataset.id);
      const input = node.querySelector(".library-rename-input");
      await submitLibraryRename(id, input?.value || "");
    });
  });
}

function startLibraryRename(id) {
  if (state.operation.active) return;
  const item = state.library.find((entry) => entry.id === id);
  if (!item) return;
  state.libraryRename = { id, name: item.name || "" };
  state.libraryWrite = { ...state.libraryWrite, id: null, confirmation: "", confirming: false };
  renderLibrary();
  requestAnimationFrame(() => {
    const input = document.querySelector(`#libraryRenameInput_${id}`);
    input?.focus();
    input?.select();
  });
}

function cancelLibraryRename() {
  state.libraryRename = { id: null, name: "" };
  renderLibrary();
}

function startLibraryWrite(id, slot = state.selectedSlot, confirming = true) {
  if (state.operation.active || state.write.active) return;
  const item = state.library.find((entry) => entry.id === id);
  if (!item) return;
  const targetSlot = Number.isInteger(slot) ? slot : state.selectedSlot;
  const keepConfirmation = state.libraryWrite.id === id && state.libraryWrite.slot === targetSlot;
  state.libraryRename = { id: null, name: "" };
  state.libraryWrite = {
    id,
    slot: targetSlot,
    confirmation: keepConfirmation ? state.libraryWrite.confirmation : "",
    confirming,
  };
  renderLibrary();
  if (confirming) {
    requestAnimationFrame(() => {
      const input = document.querySelector(`#libraryWriteInput_${id}`);
      input?.focus();
      input?.select();
    });
  }
}

function cancelLibraryWrite() {
  state.libraryWrite = {
    id: null,
    slot: state.libraryWrite.slot,
    confirmation: "",
    confirming: false,
  };
  renderLibrary();
}

async function submitLibraryRename(id, name) {
  if (state.operation.active) return;
  const nextName = String(name || "").trim();
  if (!nextName) {
    toast(t("library.renameEmpty"));
    return;
  }
  startOperation("operation.libraryRename.title", "operation.libraryRename.detail", {}, 24);
  try {
    const data = await api(`/api/library/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: nextName }),
    });
    const index = state.library.findIndex((item) => item.id === id);
    if (index >= 0) state.library[index] = data.recipe;
    state.libraryRename = { id: null, name: "" };
    if (state.selectedLibraryId === id) {
      selectRecipe(data.recipe.recipe, state.selectedSlot, id);
    } else {
      renderAll();
    }
    completeOperation("operation.libraryRename.complete");
    toast(t("toast.renamedLibrary"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
}

async function submitLibraryWrite(id, confirmation) {
  if (state.write.active) return;
  const item = state.library.find((entry) => entry.id === id);
  if (!item) return;
  const slot = state.libraryWrite.id === id ? state.libraryWrite.slot : state.selectedSlot;
  state.libraryWrite = { id, slot, confirmation, confirming: true };
  try {
    await writeRecipeToSlot({
      slot,
      recipe: item.recipe,
      confirmation,
      endpointPath: `/api/library/${id}/write-slot`,
      beforeNote: `before UI library write recipe ${id} slot ${slot + 1}`,
      buildBody: ({ slot: writeSlot, confirmation: writeConfirmation, beforeBackupId }) => ({
        slot: writeSlot,
        confirmation: writeConfirmation,
        before_backup_id: beforeBackupId,
      }),
    });
    state.libraryWrite = { id: null, slot, confirmation: "", confirming: false };
    renderAll();
  } catch (error) {
    setWriteStage("error", error.message);
    toast(error.message);
    renderLibrary();
  }
}

function renderMachineSelect() {
  const target = currentTarget();
  if (target) upsertMachine({ ...target, model: t("machine.selected") });
  const options = state.machines
    .map((machine) => {
      const label = machineLabel(machine);
      return `<option value="${machineKey(machine)}">${escapeHtml(label)}</option>`;
    })
    .join("");
  $("machineSelect").innerHTML = options || `<option value="">${t("machine.none")}</option>`;
  $("machineSelect").value = target ? machineKey(target) : "";
  $("machineSelect").disabled = state.operation.active || !state.machines.length;
}

function renderHeader() {
  const recipe = state.selectedRecipe;
  const target = currentTarget();
  const slotLabel = state.selectedSlot + 1;
  const writableSlots = state.status?.writable_slots || [];
  const slotWritable = writableSlots.includes(state.selectedSlot);
  const writeEnabled = Boolean(state.status?.write_enabled);
  const requiresWriteToken = writeTokenRequired();
  const missingWriteToken = requiresWriteToken && !currentWriteToken();
  const writeBusy = Boolean(state.write.active);
  const writeMeta = writeStageMeta[state.write.stage] || writeStageMeta.idle;
  const estimatedOutput = recipe ? recipeTotal(recipe) : 0;
  const targetVolume = recipe ? Number(recipe.volume_ml || 0) : 0;
  const outputDelta = estimatedOutput - targetVolume;
  const outputOffTarget = recipe && Math.abs(outputDelta) > 1;
  setText(
    "machineLine",
    state.status
      ? `${target.model || "TONE"} · ${target.host}:${target.port}`
      : t("status.loading")
  );
  setText("connectionBadge", state.status ? t("status.connected") : t("status.reading"));
  setText("writeStateBadge", writeEnabled ? t("status.writesEnabled") : t("status.writesLocked"));
  $("writeStateBadge")?.classList.toggle("enabled", writeEnabled);
  $("writeStateBadge")?.classList.toggle("locked", !writeEnabled);
  setText("backupStamp", state.backup?.created_at || "");
  setText("slotBadge", state.selectedLibraryId ? t("recipe.libraryToSlot", { slot: slotLabel }) : t("recipe.slot", { slot: slotLabel }));
  setText("recipeName", recipe?.name || t("recipe.noRecipe"));
  setText("recipeTypeBadge", recipe?.recipe_type || t("recipe.basic"));
  setText("recipeMeta", recipe
    ? t("recipe.meta", {
      type: recipe.recipe_type || t("recipe.basic"),
      volume: recipe.volume_ml,
      time: recipeTime(recipe).toFixed(1),
      total: recipeTotal(recipe).toFixed(1)
    })
    : "");
  setText("metricTarget", recipe ? `${recipe.volume_ml} ml` : "--");
  setText("metricTime", recipe ? `${recipeTime(recipe).toFixed(1)} s` : "--");
  setText("metricFlow", recipe ? `${averageFlow(recipe).toFixed(2)} ml/s` : "--");
  setText("metricOutput", recipe ? `${estimatedOutput.toFixed(1)} ml` : "--");
  $("metricOutput")?.closest(".metric")?.classList.toggle("off-target", Boolean(outputOffTarget));
  $("metricOutput")?.closest(".metric")?.setAttribute(
    "title",
    outputOffTarget
      ? t(outputDelta > 0 ? "recipe.outputAbove" : "recipe.outputBelow", { amount: Math.abs(outputDelta).toFixed(1) })
      : ""
  );
  setText("metricPoints", recipe ? `${recipe.point_count || recipe.points?.length || 0}` : "--");
  setText("chartCaption", recipe
    ? t("chart.caption", { points: recipe.points?.length || 0, volume: recipeTotal(recipe).toFixed(1) })
    : t("chart.captionEmpty"));
  setText("deviceHost", target?.host ? `${target.host}:${target.port}` : "--");
  setText("deviceProfile", state.status?.target?.profile_key || "--");
  setText("deviceSlots", state.status?.target?.slot_labels?.join(", ") || "--");
  setText("writeGuardCopy", writeEnabled ? t("write.enabled") : t("write.locked"));
  setText(
    "confirmHint",
    writeEnabled
      ? t(requiresWriteToken ? "write.hintEnabledRemote" : "write.hintEnabled", { slot: slotLabel })
      : t("write.hintLocked")
  );
  const tokenField = $("writeTokenField");
  if (tokenField) tokenField.hidden = !requiresWriteToken;
  const tokenInput = $("writeTokenInput");
  if (tokenInput) {
    tokenInput.disabled = writeBusy || state.operation.active || !writeEnabled || !requiresWriteToken;
    tokenInput.placeholder = t("write.tokenPlaceholder");
  }
  $("confirmInput").placeholder = `WRITE SLOT ${slotLabel}`;
  $("confirmInput").disabled = writeBusy || state.operation.active || !writeEnabled;
  $("writeButton").textContent = writeBusy ? t(writeMeta.buttonKey) : t("write.button", { slot: slotLabel });
  $("writeButton").title = t("write.buttonTitle");
  $("writeButton").disabled = writeBusy || state.operation.active || !state.status?.write_enabled || !recipe || !slotWritable || missingWriteToken;
  renderActionStates();
}

function renderWriteProgress() {
  const box = $("writeProgress");
  if (!box) return;
  const meta = writeStageMeta[state.write.stage] || writeStageMeta.idle;
  box.className = `write-progress ${state.write.stage} ${state.write.active ? "active" : ""}`;
  setText("writeProgressLabel", t(meta.labelKey));
  setText("writeElapsed", writeElapsed());
  setText("writeProgressDetail", state.write.detailKey ? t(state.write.detailKey, state.write.detailVars) : (state.write.detail || ""));
  $("writeProgressBar").style.width = `${meta.progress}%`;

  const order = ["snapshot", "write", "verify"];
  const current = state.write.stage === "complete" ? order.length : order.indexOf(state.write.stage);
  const fallbackCurrent = order.indexOf(state.write.lastActiveStage);
  document.querySelectorAll("[data-write-step]").forEach((node) => {
    const index = order.indexOf(node.dataset.writeStep);
    const isDone = state.write.stage === "complete" || (current > -1 && index < current);
    const isActive = current === index;
    const isError = ["error", "mismatch"].includes(state.write.stage) && index === Math.max(0, fallbackCurrent);
    node.classList.toggle("done", isDone);
    node.classList.toggle("active", isActive);
    node.classList.toggle("error", isError);
  });
}

function phaseOption(value) {
  return phases
    .map((phase) => `<option value="${phase.value}" ${phase.value === value ? "selected" : ""}>${t(`phase.${phase.key}`)}</option>`)
    .join("");
}

function clampNumber(value, min, max, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function formatEditorNumber(value, digits = 1) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(digits);
}

function durationSliderMax(value) {
  const duration = Number(value || 0);
  return Math.max(DEFAULT_DURATION_SLIDER_MAX_S, Math.ceil(duration / 10) * 10);
}

function renderEditor() {
  const recipe = state.selectedRecipe;
  if (!recipe) {
    $("nameInput").value = "";
    $("typeInput").value = "";
    $("volumeInput").value = 0;
    $("beverageInput").value = 1;
    $("pointRows").innerHTML = "";
    return;
  }
  $("nameInput").value = recipe.name || "";
  $("typeInput").value = recipe.recipe_type || "";
  $("volumeInput").value = recipe.volume_ml || 0;
  $("beverageInput").value = recipe.beverage_raw || 1;
  $("pointRows").innerHTML = recipe.points
    .map((point) => {
      const temp = point.temperature_c ?? "";
      const duration = clampNumber(point.duration_s, 0, Number.MAX_SAFE_INTEGER, 0);
      const flow = clampNumber(point.flow_ml_s, 0, MAX_FLOW_ML_S, 0);
      const pointNumber = point.index + 1;
      point.flow_ml_s = flow;
      return `
        <tr data-index="${point.index}">
          <td class="number-cell">${point.index + 1}</td>
          <td><select data-field="phase_raw" name="point_${pointNumber}_phase" autocomplete="off" aria-label="${escapeHtml(t("table.pointPhase", { point: pointNumber }))}">${phaseOption(point.phase_raw)}</select></td>
          <td>
            <div class="duration-control">
              <input class="duration-number" data-field="duration_s" name="point_${pointNumber}_duration_s" type="number" step="0.1" min="0" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(t("table.pointDuration", { point: pointNumber }))}" value="${formatEditorNumber(duration)}">
              <input class="duration-slider" data-duration-slider name="point_${pointNumber}_duration_slider" type="range" min="0" max="${durationSliderMax(duration)}" step="0.1" value="${formatEditorNumber(duration)}" title="${escapeHtml(t("table.durationDrag"))}" aria-label="${escapeHtml(t("table.pointDurationSlider", { point: pointNumber }))}">
            </div>
          </td>
          <td>
            <div class="flow-control">
              <input data-field="flow_ml_s" name="point_${pointNumber}_flow_ml_s" type="number" step="0.1" min="0" max="${MAX_FLOW_ML_S}" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(t("table.pointFlow", { point: pointNumber }))}" value="${formatEditorNumber(flow)}">
              <span>${escapeHtml(t("table.flowMax"))}</span>
            </div>
          </td>
          <td><input data-field="temperature_c" name="point_${pointNumber}_temperature_c" type="number" step="1" inputmode="numeric" autocomplete="off" aria-label="${escapeHtml(t("table.pointTemp", { point: pointNumber }))}" value="${temp}"></td>
          <td data-output="elapsed_end_s">${point.elapsed_end_s.toFixed(1)}</td>
          <td data-output="estimated_cumulative_ml">${point.estimated_cumulative_ml.toFixed(1)}</td>
        </tr>
      `;
    })
    .join("");
  document.querySelectorAll("#pointRows input, #pointRows select").forEach((node) => {
    node.addEventListener("input", () => {
      syncPointInput(node);
      updateFromEditor();
    });
  });
}

function syncPointInput(node) {
  const field = node.dataset.field;
  if (node.matches("[data-duration-slider]")) {
    const numberInput = node.closest(".duration-control")?.querySelector(".duration-number");
    if (numberInput) numberInput.value = node.value;
    return;
  }
  if (field === "duration_s") {
    const value = clampNumber(node.value, 0, Number.MAX_SAFE_INTEGER, 0);
    node.value = formatEditorNumber(value);
    const slider = node.closest(".duration-control")?.querySelector("[data-duration-slider]");
    if (slider) {
      if (value > Number(slider.max)) slider.max = durationSliderMax(value);
      slider.value = formatEditorNumber(value);
    }
    return;
  }
  if (field === "flow_ml_s") {
    node.value = formatEditorNumber(clampNumber(node.value, 0, MAX_FLOW_ML_S, 0));
  }
}

function updateFromEditor() {
  const recipe = state.selectedRecipe;
  if (!recipe) return;
  recipe.name = $("nameInput").value.trim() || t("recipe.untitled");
  recipe.recipe_type = $("typeInput").value.trim() || null;
  recipe.volume_ml = Number($("volumeInput").value || 0);
  recipe.beverage_raw = Number($("beverageInput").value || 1);
  recipe.beverage = recipe.beverage_raw === 2 ? "tea" : "coffee";
  recipe.full_name = recipe.recipe_type ? `${recipe.name}#${recipe.recipe_type}` : recipe.name;

  document.querySelectorAll("#pointRows tr").forEach((row) => {
    const index = Number(row.dataset.index);
    const point = recipe.points[index];
    point.phase_raw = Number(row.querySelector('[data-field="phase_raw"]')?.value || 0);
    point.duration_s = clampNumber(row.querySelector('[data-field="duration_s"]')?.value, 0, Number.MAX_SAFE_INTEGER, 0);
    point.flow_ml_s = clampNumber(row.querySelector('[data-field="flow_ml_s"]')?.value, 0, MAX_FLOW_ML_S, 0);
    point.temperature_c = row.querySelector('[data-field="temperature_c"]')?.value === ""
      ? null
      : Number(row.querySelector('[data-field="temperature_c"]')?.value);
    point.phase = phases.find((phase) => phase.value === point.phase_raw)?.label || "none";
    point.time_ticks_100ms = Math.round((point.duration_s || 0) * 10);
    point.flow_raw = Math.round((point.flow_ml_s || 0) * 10);
    point.temperature_k = point.temperature_c == null ? 0 : Math.round(point.temperature_c + 273);
  });
  recomputeRecipe(recipe);
  updateDerivedCells(recipe);
  renderHeader();
  renderChart();
}

function recomputeRecipe(recipe) {
  let elapsed = 0;
  let volume = 0;
  recipe.points.forEach((point, index) => {
    point.index = index;
    point.duration_s = clampNumber(point.duration_s, 0, Number.MAX_SAFE_INTEGER, 0);
    point.flow_ml_s = clampNumber(point.flow_ml_s, 0, MAX_FLOW_ML_S, 0);
    elapsed += point.duration_s;
    volume += point.duration_s * point.flow_ml_s;
    point.elapsed_end_s = elapsed;
    point.estimated_cumulative_ml = Math.round(volume * 1000) / 1000;
  });
}

function updateDerivedCells(recipe) {
  recipe.points.forEach((point, index) => {
    const row = document.querySelector(`#pointRows tr[data-index="${index}"]`);
    if (!row) return;
    const durationInput = row.querySelector('[data-field="duration_s"]');
    const durationSlider = row.querySelector("[data-duration-slider]");
    const flowInput = row.querySelector('[data-field="flow_ml_s"]');
    if (durationInput) durationInput.value = formatEditorNumber(point.duration_s);
    if (durationSlider) {
      if (point.duration_s > Number(durationSlider.max)) durationSlider.max = durationSliderMax(point.duration_s);
      durationSlider.value = formatEditorNumber(point.duration_s);
    }
    if (flowInput) flowInput.value = formatEditorNumber(point.flow_ml_s);
    row.querySelector('[data-output="elapsed_end_s"]').textContent = point.elapsed_end_s.toFixed(1);
    row.querySelector('[data-output="estimated_cumulative_ml"]').textContent =
      point.estimated_cumulative_ml.toFixed(1);
  });
}

function renderChart() {
  const recipe = state.selectedRecipe;
  const svg = $("curveChart");
  if (!recipe) {
    svg.innerHTML = "";
    return;
  }
  const width = 980;
  const height = 360;
  const pad = { left: 58, right: 76, top: 24, bottom: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const totalTime = Math.max(1, recipeTime(recipe));
  const totalVolume = Math.max(1, Number(recipe.volume_ml || 0), recipeTotal(recipe));
  const targetVolume = Number(recipe.volume_ml || 0);
  const maxFlow = Math.max(8, ...recipe.points.map((point) => point.flow_ml_s || 0));
  const maxTemp = 100;
  const minTemp = 70;
  const x = (seconds) => pad.left + (seconds / totalTime) * innerW;
  const yFlow = (flow) => pad.top + innerH - (flow / maxFlow) * innerH;
  const yVolume = (volume) => pad.top + innerH - (volume / totalVolume) * innerH;
  const yTemp = (temp) => pad.top + innerH - ((temp - minTemp) / (maxTemp - minTemp)) * innerH;

  let elapsed = 0;
  let cumulativeVolume = 0;
  const flowPoints = [];
  const volumePoints = [];
  const tempPoints = [];
  const bands = [];
  recipe.points.forEach((point) => {
    const start = elapsed;
    const end = elapsed + point.duration_s;
    const startVolume = cumulativeVolume;
    const endVolume = cumulativeVolume + point.duration_s * point.flow_ml_s;
    const phase = phases.find((item) => item.value === point.phase_raw) || phases[0];
    bands.push(`<rect class="phase-band" x="${x(start)}" y="${pad.top}" width="${Math.max(1, x(end) - x(start))}" height="${innerH}" fill="${phase.color}"></rect>`);
    flowPoints.push(`${x(start)},${yFlow(point.flow_ml_s)}`, `${x(end)},${yFlow(point.flow_ml_s)}`);
    volumePoints.push(`${x(start)},${yVolume(startVolume)}`, `${x(end)},${yVolume(endVolume)}`);
    if (point.temperature_c != null && point.temperature_c > 0) {
      tempPoints.push(`${x(start)},${yTemp(point.temperature_c)}`, `${x(end)},${yTemp(point.temperature_c)}`);
    }
    elapsed = end;
    cumulativeVolume = endVolume;
  });

  const grid = [];
  for (let i = 0; i <= 4; i += 1) {
    const yy = pad.top + (innerH / 4) * i;
    grid.push(`<line class="grid-line" x1="${pad.left}" x2="${width - pad.right}" y1="${yy}" y2="${yy}"></line>`);
  }
  for (let i = 0; i <= 6; i += 1) {
    const xx = pad.left + (innerW / 6) * i;
    grid.push(`<line class="grid-line" y1="${pad.top}" y2="${height - pad.bottom}" x1="${xx}" x2="${xx}"></line>`);
  }

  svg.innerHTML = `
    ${bands.join("")}
    ${grid.join("")}
    <line class="target-line" x1="${pad.left}" x2="${width - pad.right}" y1="${yVolume(targetVolume)}" y2="${yVolume(targetVolume)}"></line>
    <line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}"></line>
    <line class="axis" x1="${pad.left}" x2="${pad.left}" y1="${pad.top}" y2="${height - pad.bottom}"></line>
    <polyline class="flow-line" points="${flowPoints.join(" ")}"></polyline>
    <polyline class="volume-line" points="${volumePoints.join(" ")}"></polyline>
    <polyline class="temp-line" points="${tempPoints.join(" ")}"></polyline>
    <circle class="curve-end-dot flow-dot" cx="${x(totalTime)}" cy="${yFlow(recipe.points.at(-1)?.flow_ml_s || 0)}" r="5"></circle>
    <circle class="curve-end-dot volume-dot" cx="${x(totalTime)}" cy="${yVolume(recipeTotal(recipe))}" r="5"></circle>
    <text class="chart-label" x="${pad.left}" y="${height - 16}">0s</text>
    <text class="chart-label" x="${width - pad.right - 54}" y="${height - 16}">${totalTime.toFixed(1)}s</text>
    <text class="chart-label" x="10" y="${pad.top + 8}">${maxFlow.toFixed(1)} ml/s</text>
    <text class="chart-label" x="10" y="${height - pad.bottom}">0</text>
    <text class="chart-label target-label" x="${width - pad.right - 84}" y="${Math.max(pad.top + 16, yVolume(targetVolume) - 8)}">${t("chart.target")}</text>
    <text class="chart-label volume-label" x="${width - pad.right + 10}" y="${pad.top + 8}">${totalVolume.toFixed(0)} ml</text>
    <text class="chart-label" x="${width - pad.right + 10}" y="${height - pad.bottom}">0 ml</text>
    <text class="chart-label temp-label" x="${width - 58}" y="${pad.top + 26}">${maxTemp} C</text>
  `;
  svg.setAttribute("aria-label", t("chart.ariaDetailed", {
    name: recipe.name || t("recipe.untitled"),
    points: recipe.points?.length || 0,
    time: totalTime.toFixed(1),
    volume: recipeTotal(recipe).toFixed(1),
    target: targetVolume.toFixed(0)
  }));
}

function renderAll() {
  applyStaticI18n();
  renderMachineSelect();
  renderHeader();
  renderOperationStatus();
  renderWriteProgress();
  renderSlots();
  renderParameters();
  renderLibrary();
  renderEditor();
  renderChart();
}

function renderParameters() {
  const rows = state.parameters || [];
  if (!rows.length) {
    $("parameterList").innerHTML = `<div class="empty-panel">${t("parameters.empty")}</div>`;
    return;
  }
  $("parameterList").innerHTML = rows
    .map((item) => {
      const label = item.name || `param_${item.identifier}`;
      const value = typeof item.value === "object" ? JSON.stringify(item.value) : item.value;
      const displayValue = value ?? item.value_hex ?? "";
      const safeValue = String(displayValue).trim() || t("parameters.emptyValue");
      return `
        <div class="parameter-row">
          <span title="${escapeHtml(label)}">${escapeHtml(label)}</span>
          <code title="${escapeHtml(safeValue)}">${escapeHtml(safeValue)}</code>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadStatus() {
  state.status = await api("/api/status");
  upsertMachine(state.status.target);
}

async function loadLibrary() {
  state.library = (await api("/api/library")).recipes;
}

async function loadCurrent(fresh = false) {
  const data = await api(`/api/current${fresh ? "?fresh=1" : ""}`);
  state.backup = data.backup;
  state.parameters = state.backup.data.parameters || state.parameters;
  const recipes = state.backup.data.recipes || [];
  if (!recipes.length) {
    state.selectedRecipe = null;
    state.selectedLibraryId = null;
    renderAll();
    return;
  }
  const preferred = recipes.find((recipe) => recipe.slot === state.selectedSlot) || recipes[3] || recipes[0];
  if (!state.selectedRecipe || fresh) selectRecipe(preferred, preferred.slot, null);
}

async function loadParameters(fresh = false) {
  const data = await api(`/api/parameters${fresh ? "?fresh=1" : ""}`);
  state.parameters = data.parameters || [];
}

function applyOptimisticWrite(slot, recipe) {
  const next = cloneRecipe(recipe);
  recomputeRecipe(next);
  next.slot = slot;
  next.number = slot;
  next.point_count = next.points?.length || 0;
  delete next.raw_hex;

  if (state.backup?.data?.recipes?.length) {
    const recipes = state.backup.data.recipes;
    const index = recipes.findIndex((item) => item.slot === slot);
    if (index >= 0) recipes[index] = next;
    else recipes.push(next);
  }
  selectRecipe(next, slot, null);
}

function compactValue(value) {
  if (value == null) return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function verificationDetail(verification, slotLabel, readback) {
  if (!verification) return t("verify.noData", { slot: slotLabel });
  if (verification.verified) {
    const pointCount = readback?.point_count ?? readback?.points?.length ?? 0;
    return t("verify.ok", { slot: slotLabel, points: pointCount });
  }
  if (verification.error) {
    return t("verify.error", { slot: slotLabel, error: verification.error });
  }
  const first = verification.mismatches?.[0];
  if (!first) return t("verify.notVerified", { slot: slotLabel });
  return t("verify.mismatch", {
    slot: slotLabel,
    count: verification.mismatch_count,
    field: first.field,
    expected: compactValue(first.expected),
    actual: compactValue(first.actual)
  });
}

async function writeRecipeToSlot({
  slot,
  recipe,
  confirmation,
  endpointPath = "/api/write-slot",
  beforeNote,
  buildBody,
  afterAccepted,
}) {
  if (state.write.active) return null;
  if (!recipe) throw new Error(t("recipe.noRecipe"));
  const slotLabel = slot + 1;
  const expected = `WRITE SLOT ${slotLabel}`;
  if (confirmation !== expected) {
    throw new Error(t("error.confirmation", { expected }));
  }
  const payloadRecipe = cloneRecipe(recipe);
  recomputeRecipe(payloadRecipe);
  payloadRecipe.slot = slot;
  payloadRecipe.number = slot;
  payloadRecipe.point_count = payloadRecipe.points?.length || 0;

  setWriteStage("snapshot", "write.detail.snapshot", {}, { slot: slotLabel });
  const backup = await api("/api/backup", {
    method: "POST",
    body: JSON.stringify({
      note: beforeNote || `before UI write slot ${slotLabel}`,
      slots: [slotLabel],
      params: [],
    }),
  });

  setWriteStage("write", "write.detail.sending", {
    backupId: backup.backup.id,
  }, { name: payloadRecipe.name || t("recipe.untitled"), slot: slotLabel });

  const body = buildBody
    ? buildBody({
      slot,
      recipe: payloadRecipe,
      confirmation,
      beforeBackupId: backup.backup.id,
    })
    : {
      slot,
      recipe: payloadRecipe,
      confirmation,
      before_backup_id: backup.backup.id,
    };
  const data = await api(endpointPath, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (typeof afterAccepted === "function") afterAccepted(data);

  const readback = data.write.readback;
  const verification = data.write.verification;
  setWriteStage("verify", "write.detail.comparing", {
    writeId: data.write.id,
  }, { slot: slotLabel });
  await loadLibrary();
  const detail = verificationDetail(verification, slotLabel, readback);
  if (verification?.verified && readback) {
    applyOptimisticWrite(slot, readback);
  } else {
    renderAll();
  }
  setWriteStage(verification?.verified ? "complete" : "mismatch", detail);
  toast(verification?.verified ? t("toast.slotVerified", { slot: slotLabel }) : t("toast.slotNotVerified", { slot: slotLabel }));
  return data;
}

async function init() {
  startOperation("operation.init.title", "operation.init.status", {}, 10);
  try {
    await loadStatus();
    updateOperation("operation.init.recipes", {}, 32);
    await loadCurrent(false);
    updateOperation("operation.init.params", {}, 66);
    await loadParameters(false);
    updateOperation("operation.init.library", {}, 84);
    await loadLibrary();
    renderAll();
    completeOperation("operation.init.complete");
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
}

async function discoverMachines() {
  const data = await api("/api/discover?timeout=2");
  state.machines = data.machines || [];
  upsertMachine(data.selected || currentTarget());
  renderMachineSelect();
  return state.machines;
}

async function selectMachineByKey(value, onStep = () => {}) {
  const machine = state.machines.find((item) => machineKey(item) === value);
  if (!machine) return;
  onStep("operation.switch.detail", { machine: machineLabel(machine) }, 12);
  await api("/api/machine", {
    method: "POST",
    body: JSON.stringify({ host: machine.host, port: machine.port, profile_key: machine.profile_key }),
  });
  onStep("operation.switch.current", {}, 34);
  await loadStatus();
  state.selectedRecipe = null;
  await loadCurrent(true);
  onStep("operation.switch.params", {}, 70);
  await loadParameters(false);
  onStep("operation.switch.library", {}, 86);
  await loadLibrary();
  renderAll();
}

$("refreshButton").addEventListener("click", async () => {
  if (state.operation.active) return;
  startOperation("operation.refresh.title", "operation.refresh.current", {}, 12);
  try {
    toast(t("toast.reading"));
    await loadCurrent(true);
    updateOperation("operation.refresh.params", {}, 58);
    await loadParameters(false);
    updateOperation("operation.refresh.library", {}, 82);
    await loadLibrary();
    renderAll();
    completeOperation("operation.refresh.complete");
    toast(t("toast.refreshed"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
});

$("discoverButton").addEventListener("click", async () => {
  if (state.operation.active) return;
  startOperation("operation.discover.title", "operation.discover.detail", {}, 15);
  try {
    toast(t("toast.discovering"));
    const machines = await discoverMachines();
    completeOperation(machines.length ? "operation.discover.complete" : "operation.discover.empty", { count: machines.length });
    toast(machines.length ? t("toast.found", { count: machines.length }) : t("toast.notFound"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
});

$("machineSelect").addEventListener("change", async () => {
  if (state.operation.active) return;
  const option = $("machineSelect").selectedOptions?.[0];
  startOperation("operation.switch.title", "operation.switch.detail", { machine: option?.textContent || $("machineSelect").value }, 10);
  try {
    toast(t("toast.switching"));
    await selectMachineByKey($("machineSelect").value, updateOperation);
    completeOperation("operation.switch.complete");
    toast(t("toast.machineSelected"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
});

$("languageSelect").addEventListener("change", () => {
  setLanguage($("languageSelect").value);
});

$("writeTokenInput")?.addEventListener("input", () => {
  storeWriteToken(currentWriteToken());
  renderHeader();
});

$("refreshParamsButton").addEventListener("click", async () => {
  if (state.operation.active) return;
  startOperation("operation.params.title", "operation.params.detail", {}, 20);
  try {
    toast(t("toast.readingParams"));
    await loadParameters(true);
    renderAll();
    completeOperation("operation.params.complete");
    toast(t("toast.paramsRefreshed"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
});

$("backupButton").addEventListener("click", async () => {
  if (state.operation.active) return;
  startOperation("operation.backup.title", "operation.backup.detail", {}, 18);
  try {
    const data = await api("/api/backup", {
      method: "POST",
      body: JSON.stringify({ note: "manual UI backup" }),
    });
    state.backup = data.backup;
    renderAll();
    completeOperation("operation.backup.complete");
    toast(t("toast.backupSaved"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
});

$("saveLibraryButton").addEventListener("click", async () => {
  if (state.operation.active) return;
  startOperation("operation.library.title", "operation.library.detail", {}, 24);
  try {
    updateFromEditor();
    const data = await api("/api/library", {
      method: "POST",
      body: JSON.stringify({ recipe: state.selectedRecipe }),
    });
    state.library.unshift(data.recipe);
    state.selectedLibraryId = data.recipe.id;
    renderAll();
    completeOperation("operation.library.complete");
    toast(t("toast.savedLibrary"));
  } catch (error) {
    failOperation(error.message);
    toast(error.message);
  }
});

$("writeButton").addEventListener("click", async () => {
  if (state.write.active) return;
  const slot = state.selectedSlot;
  try {
    updateFromEditor();
    await writeRecipeToSlot({
      slot,
      recipe: state.selectedRecipe,
      confirmation: $("confirmInput").value,
      afterAccepted: () => {
        $("confirmInput").value = "";
      },
    });
  } catch (error) {
    setWriteStage("error", error.message);
    toast(error.message);
  }
});

["nameInput", "typeInput", "volumeInput", "beverageInput"].forEach((id) => {
  $(id).addEventListener("input", updateFromEditor);
});

applyStaticI18n();
$("writeTokenInput").value = readStoredWriteToken();
init();
