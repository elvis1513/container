# API 契约（MVP）：装箱优化器

本文件定义 MVP 阶段后端对前端提供的最小 API 契约。实现必须以本契约为准；任何变更需同步更新本文件。

## 1. 数据结构（草案）

### 1.1 Item（货物）
```json
{
  "id": "ITEM-001",
  "name": "Carton A",
  "size": {"l": 40, "w": 30, "h": 20},
  "weight": 8.5,
  "quantity": 10,
  "constraints": {
    "rotations": ["LWH", "WLH", "LHW"],
    "stackable": true,
    "fragile": false,
    "priority": 0
  }
}
```

### 1.2 Container（容器）
```json
{
  "id": "CNTR-20GP",
  "name": "20GP",
  "innerSize": {"l": 5898, "w": 2352, "h": 2393},
  "maxWeight": 28000
}
```

### 1.3 Placement（摆放结果）
```json
{
  "itemId": "ITEM-001",
  "instanceIndex": 0,
  "containerId": "CNTR-20GP",
  "position": {"x": 0, "y": 0, "z": 0},
  "orientation": "LWH"
}
```

## 2. 接口列表（MVP 必须）

### 2.1 求解
`POST /api/packing/solve`

**Request**
```json
{
  "containers": [/* Container */],
  "items": [/* Item */],
  "options": {
    "objective": "MAX_VOLUME_UTILIZATION",
    "allowSplitAcrossContainers": false,
    "seed": 12345
  }
}
```

**Response**
```json
{
  "status": "OK",
  "score": {
    "volumeUtilization": 0.78,
    "remainingVolume": 1234567,
    "totalWeight": 15200
  },
  "placements": [/* Placement */],
  "unplaced": [
    {"itemId": "ITEM-009", "reason": "OVERWEIGHT_OR_NO_SPACE"}
  ],
  "warnings": [],
  "meta": {
    "algorithm": "heuristic-ep-v1",
    "seed": 12345,
    "durationMs": 420
  }
}
```

### 2.2 校验（手动摆放后）
`POST /api/packing/validate`

**Request**
```json
{
  "containers": [/* Container */],
  "items": [/* Item */],
  "placements": [/* Placement */]
}
```

**Response**
```json
{
  "valid": true,
  "errors": [],
  "metrics": {
    "volumeUtilization": 0.77,
    "totalWeight": 15400
  }
}
```

错误示例（valid=false）：
- `COLLISION`
- `OUT_OF_BOUNDS`
- `OVERWEIGHT`

### 2.3 导出
`POST /api/packing/export`

**Request**
```json
{
  "format": "ZIP",
  "payload": {
    "containers": [/* Container */],
    "items": [/* Item */],
    "placements": [/* Placement */],
    "score": {/* score */},
    "meta": {/* meta */}
  }
}
```

**Response**
- `application/zip`（包含 `plan.json`、`items.csv`、`view.png`）
- 或返回 `exportId`（如采用异步导出；MVP 优先同步）

## 3. 约定
- 所有尺寸单位需统一（建议：mm；重量：kg）。若采用其它单位，必须在 `meta` 声明并全链路一致。
- `seed` 若为空，后端必须返回实际使用的 seed，确保可复现。
