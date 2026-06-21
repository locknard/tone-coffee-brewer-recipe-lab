# TONE Coffee Brewer Recipe Lab

Unofficial local HTTP recipe manager and automation toolkit for TONE Coffee Brewer users.

非官方的 TONE Coffee Brewer 本地 HTTP 配方管理工具，用于读取、备份、编辑和写入咖啡机配方，并为 Home Assistant、蓝牙秤联动和自动化调参预留接口。

## 项目出发点

本仓库由 TONE Coffee Brewer 用户和智能家居爱好者创建和维护，用于探索本地 HTTP 方式下的配方管理、状态读取和自动化协作。

这个项目按“非官方本地 HTTP 工具”方向组织。它关注的是 TONE Coffee Brewer 在本地网络中的配方维护、状态读取和自动化集成能力，目标是补充现有 App 在高级用户工具、智能家居和批量配置场景里的使用方式。

这个仓库提供一个 **本地 HTTP 参考实现**，核心原则是：

1. **轻量、透明**：用本地 HTTP 服务和简单 Web UI 管理配方，连接与数据格式逻辑集中在少量 Python 代码里，方便审阅和协作。
2. **默认安全**：默认只读；写入需显式开启；所有 slot 都使用同一种写入流程，每次写入前自动备份。
3. **便于自动化协作**：CLI 和 HTTP API 都尽量使用清晰、稳定、可读写的状态表达，让代码智能体和大模型工具可以读取机器状态、修改配方文件、生成实验版本，并在用户确认后写入设备。
4. **为 Home Assistant 预留路径**：当前以 REST API 和 CLI 为主；后续计划提供标准集成方式，让 TONE 机器可以通过受控的本地接口纳入智能家居工作流。

如果你也在用 TONE Coffee Brewer，或对咖啡配方管理、Home Assistant、智能家居和自动化萃取优化有兴趣，欢迎 Issue / PR。这个项目以爱好者维护和开放审阅为目标，希望成为一个轻量、可靠、适合高级用户维护的本地入口。

## 路线图

- [x] 本地 HTTP 服务和配方读写 API
- [x] 用于发现设备、备份和编辑 slot 的 CLI
- [x] 通用机器 profile 与多种发现消息
- [x] 能力注册表：参数读写、配方读写、固件相关数据包描述
- [x] 面向大模型的可读写状态接口：让代码智能体更容易读取当前配置、修改 JSON 配方、生成可审阅的变更
- [x] 数据结构与连接流程已整理为内部开发资料，便于后续审阅和能力补全
- [ ] 更完整的机器状态读取：包括当前 slot、配方摘要、设备连接状态和可用于自动化判断的运行信息
- [ ] Home Assistant 集成，包括实体暴露、配方同步、冲煮触发等能力
- [ ] 蓝牙秤联动：读取萃取重量、时间和流速反馈，帮助用户分析和优化配方
- [ ] 配方分享能力：导出、导入和分享可复现的 TONE 配方
- [ ] 更多预置配方：提供适合不同豆子、烘焙度和萃取目标的团队/社区配方模板

## 项目结构

- `tone/`：本地 TONE 连接辅助代码、设备发现、配方数据包解析/构建，以及 CLI。
- `tone_manager/`：基于 Python 标准库的 HTTP 服务和静态 Web UI。
- `docs/`：连接流程、CLI 用法和操作说明。
- `dev_resources/network_observation/`：可选的本地网络观察辅助脚本，不包含抓包结果。

## 运行 HTTP 版本

机器地址可以通过发现功能选择，也可以用环境变量指定。`.env.example` 记录了常用配置项；当前服务不会自动读取 `.env`，运行前请在 shell 里导出需要的变量。

只读模式：

```bash
cd /path/to/tone
export TONE_HOST=<tone-host>
python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

打开：

```text
http://127.0.0.1:8765
```

写入模式需要显式开启。默认情况下，HTTP 版本在确认后可以写入 slots 1-4：

```bash
cd /path/to/tone
export TONE_HOST=<tone-host>
TONE_ENABLE_WRITES=1 python3 tone_manager/server.py --host 127.0.0.1 --port 8765
```

服务默认只监听 `127.0.0.1`。如果确实要把写入模式绑定到局域网或公网地址，必须同时设置 `TONE_ALLOW_REMOTE_WRITES=1` 和 `TONE_WRITE_TOKEN`，前端或 API 请求会通过 `X-TONE-Write-Token` 发送该 token。

UI 和 API 在写入前都要求输入对应 slot 的精确确认文本：

```text
WRITE SLOT N
```

## CLI 快速开始

发现设备：

```bash
cd /path/to/tone
python3 tone/tone_cli.py discover
```

查看当前引入的能力和机器 profile：

```bash
python3 tone/tone_cli.py capabilities
```

读取参数，例如 live value：

```bash
python3 tone/tone_cli.py read-param --host <tone-host> --identifier 21
```

备份设备：

```bash
python3 tone/tone_cli.py backup --host <tone-host>
```

把 slot 4 导出为可编辑 JSON：

```bash
python3 tone/tone_cli.py read-slot --host <tone-host> --slot 4 --out work/slot4.json
```

修改一个配方点，并重新计算总量：

```bash
python3 tone/tone_cli.py set-point --recipe-json work/slot4.json --point 3 --flow-ml-s 4.2 --out work/slot4.next.json
```

生成 TCP 写入数据包，但不发送：

```bash
python3 tone/tone_cli.py render-packet --slot 4 --recipe-json work/slot4.next.json
```

只有在备份并明确确认后，才写入指定 slot：

```bash
python3 tone/tone_cli.py write-slot \
  --host <tone-host> \
  --slot 4 \
  --recipe-json work/slot4.next.json \
  --confirm "WRITE SLOT 4" \
  --enable-write
```

## 安全默认值

- 设备发现和读取默认是安全操作。
- 写入默认关闭，必须显式开启。
- HTTP 服务默认只绑定本机地址；远程写入需要额外 token。
- 开启写入后，slots 1-4 使用同一种数据包格式写入。
- 确认文本必须和目标 slot 匹配，例如 `WRITE SLOT 2`。
- 每次 CLI/UI 写入前都会先创建一份新的备份。
- 当前实现不会启动冲煮、冲洗、固件更新或服务动作。
- 固件相关数据包已登记在能力表里，但不会在 UI 默认执行。

## 已验证能力

- TCP 控制端口：`50000`
- UDP 发现端口：`60000`
- profile: `primary`
- writable slots: `1-4`
- 已验证无内容变化写入，回读内容和发送数据包一致。
- `alternate` profile 已接入自动发现和参数能力，配方转换逻辑等待真实设备样本验证后再标记 verified。

## License

Apache License 2.0. See [LICENSE](LICENSE).

更多细节见 [docs/protocol.md](docs/protocol.md)、[docs/cli.md](docs/cli.md) 和 [docs/public_release_checklist.md](docs/public_release_checklist.md)。
