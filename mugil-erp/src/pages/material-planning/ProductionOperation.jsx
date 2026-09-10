import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Eye } from "lucide-react";
import Header from "../../components/Header";
import "./ProductionOperation.css";

const employees = [
  "R. Kumar",
  "S. Elango",
  "Manoj Prabhu",
  "Arun Kumar",
  "Ravi Shankar",
];

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const PRODUCTION_MATERIALS = {
  "PM-PL01": {
    id: "PM-PL01",
    project: "BHEL-001",
    dwg: "DWG-01",
    material: "Plate",
    materialCode: "PL-001",
    materialSpec: "IS2062 E250A",
    thickness: "8 mm",
    size: "2000 × 2000",
    unit: "Nos",
    bomDescription: "Base Plate — Description-1",
    poNumber: "PO-001",
    poDescription: "Description-1",
    requiredQty: 5,
    receivedQty: 5,
    issuedQty: 5,
  },
  "PM-PI01": {
    id: "PM-PI01",
    project: "BHEL-001",
    dwg: "DWG-02",
    material: "Pipe",
    materialCode: "PI-001",
    materialSpec: "IS1239 Medium",
    thickness: "4 mm",
    size: "100 NB",
    unit: "Nos",
    bomDescription: "Support Pipe — Description-2",
    poNumber: "PO-002",
    poDescription: "Description-2",
    requiredQty: 5,
    receivedQty: 5,
    issuedQty: 5,
  },
  "PM-CH01": {
    id: "PM-CH01",
    project: "BHEL-001",
    dwg: "DWG-02",
    material: "Channel",
    materialCode: "CH-001",
    materialSpec: "IS808 ISMC150",
    thickness: "6 mm",
    size: "150 × 75",
    unit: "Nos",
    bomDescription: "Frame Channel — Description-3",
    poNumber: "PO-003",
    poDescription: "Description-3",
    requiredQty: 5,
    receivedQty: 5,
    issuedQty: 5,
  },
  "PM-PI02": {
    id: "PM-PI02",
    project: "BHEL-001",
    dwg: "DWG-03",
    material: "Pipe",
    materialCode: "PI-002",
    materialSpec: "IS1239 Medium",
    thickness: "6 mm",
    size: "100 NB",
    unit: "Nos",
    bomDescription: "Cross Pipe — Description-4",
    poNumber: "PO-004",
    poDescription: "Description-4",
    requiredQty: 5,
    receivedQty: 5,
    issuedQty: 5,
  },
  "PM-AN01": {
    id: "PM-AN01",
    project: "BHEL-002",
    dwg: "DWG-101",
    material: "Angle",
    materialCode: "AN-001",
    materialSpec: "IS808 ISA50x50",
    thickness: "5 mm",
    size: "50 × 50",
    unit: "Nos",
    bomDescription: "Support Angle — Description-5",
    poNumber: "PO-101",
    poDescription: "Description-5",
    requiredQty: 8,
    receivedQty: 8,
    issuedQty: 8,
  },
};

const materialById = (id) => PRODUCTION_MATERIALS[id];

// -------------------------------------------------------------------------
// Stage factory — one entry per step of the process route ALREADY DEFINED
// in Production Assembly Integration. Production Operation only ever
// executes these steps; it never adds, removes or reorders them.
// -------------------------------------------------------------------------
const stage = (sequence, name, id, qcRequired, overrides = {}) => ({
  sequence,
  name,
  id,
  qcRequired,
  availableQty: 0,
  pendingOperationQty: 0,
  awaitingQcQty: 0,
  reworkQty: 0,
  releasedQty: 0,
  started: false,
  lastOperation: null,
  lastQc: null,
  lastRework: null,
  ...overrides,
});

const hist = (date, event) => ({ date, event });

// -------------------------------------------------------------------------
// Seed assemblies — created in Production Assembly Integration. Only
// assemblies that exist here can ever appear in Production Operation.
// -------------------------------------------------------------------------
const initialAssemblies = [
  {
    assemblyId: "ASM-001",
    project: "BHEL-001",
    plannedQty: 5,
    createdDate: "2026-08-29",
    inputs: [
      { sourceType: "material", sourceId: "PM-PL01", useQty: 5 },
      { sourceType: "material", sourceId: "PM-PI01", useQty: 5 },
    ],
    processChain: [
      stage(1, "Fit-up", "FIT01", true, {
        availableQty: 5,
        releasedQty: 5,
        lastOperation: {
          performedBy: "Manoj Prabhu",
          supervisedBy: "Arun Kumar",
          date: "2026-08-21",
          time: "09:10",
          remarks: "Alignment verified, dimensions within tolerance.",
          completedQty: 5,
          rejectedQty: 0,
        },
        lastQc: {
          verifiedBy: "Ravi Shankar",
          remarks: "Fit-up accepted, cleared for welding.",
          date: "2026-08-21",
          acceptedQty: 5,
          rejectedQty: 0,
        },
      }),
      stage(2, "Welding", "WEL01", true, {
        availableQty: 5,
        reworkQty: 1,
        releasedQty: 4,
        lastOperation: {
          performedBy: "R. Kumar",
          supervisedBy: "Arun Kumar",
          date: "2026-08-23",
          time: "11:00",
          remarks: "All 5 pieces welded.",
          completedQty: 5,
          rejectedQty: 0,
        },
        lastQc: {
          verifiedBy: "Ravi Shankar",
          remarks: "1 piece shows porosity near joint 3 — rework required.",
          date: "2026-08-24",
          acceptedQty: 4,
          rejectedQty: 1,
        },
      }),
      stage(3, "Grinding", "GRD01", false, {
        availableQty: 4,
        pendingOperationQty: 4,
      }),
      stage(4, "Painting", "PNT01", true, { availableQty: 0 }),
    ],
    history: [
      hist("2026-08-29", "ASM-001 created — Project BHEL-001"),
      hist(
        "2026-08-29",
        "Material allocated: Plate 5 Nos (DWG-01), Pipe 5 Nos (DWG-02)",
      ),
      hist("2026-08-21", "Fit-up started by Manoj Prabhu"),
      hist("2026-08-21", "Fit-up completed — 5 Nos"),
      hist("2026-08-21", "Fit-up QC Approved by Ravi Shankar"),
      hist("2026-08-23", "Welding started by R. Kumar"),
      hist("2026-08-23", "Welding completed — 5 Nos"),
      hist("2026-08-24", "Welding QC: 4 Accepted, 1 Rejected by Ravi Shankar"),
      hist("2026-08-24", "1 Nos sent to Rework (Welding)"),
      hist("2026-08-24", "4 Nos released to Grinding"),
    ],
  },
  {
    assemblyId: "ASM-002",
    project: "BHEL-001",
    plannedQty: 5,
    createdDate: "2026-09-02",
    inputs: [
      { sourceType: "material", sourceId: "PM-CH01", useQty: 5 },
      { sourceType: "material", sourceId: "PM-PI02", useQty: 5 },
    ],
    processChain: [
      stage(1, "Fit-up", "FIT01", true, {
        availableQty: 5,
        releasedQty: 5,
        lastOperation: {
          performedBy: "S. Elango",
          supervisedBy: "Manoj Prabhu",
          date: "2026-08-30",
          time: "10:00",
          remarks: "Good alignment across all 5 pieces.",
          completedQty: 5,
          rejectedQty: 0,
        },
        lastQc: {
          verifiedBy: "Ravi Shankar",
          remarks: "Cleared for welding.",
          date: "2026-08-30",
          acceptedQty: 5,
          rejectedQty: 0,
        },
      }),
      stage(2, "Welding", "WEL01", true, {
        availableQty: 5,
        awaitingQcQty: 5,
        lastOperation: {
          performedBy: "Arun Kumar",
          supervisedBy: "S. Elango",
          date: "2026-09-01",
          time: "14:30",
          remarks: "All welds completed, awaiting QC.",
          completedQty: 5,
          rejectedQty: 0,
        },
      }),
      stage(3, "Inspection", "INS01", true, { availableQty: 0 }),
    ],
    history: [
      hist("2026-09-02", "ASM-002 created — Project BHEL-001"),
      hist(
        "2026-09-02",
        "Material allocated: Channel 5 Nos (DWG-02), Pipe 5 Nos (DWG-03)",
      ),
      hist("2026-08-30", "Fit-up started by S. Elango"),
      hist("2026-08-30", "Fit-up completed — 5 Nos"),
      hist("2026-08-30", "Fit-up QC Approved by Ravi Shankar"),
      hist("2026-09-01", "Welding started by Arun Kumar"),
      hist("2026-09-01", "Welding completed — 5 Nos, awaiting QC verification"),
    ],
  },
  {
    assemblyId: "ASM-003",
    project: "BHEL-001",
    plannedQty: 1,
    createdDate: "2026-09-04",
    inputs: [
      { sourceType: "assembly", sourceId: "ASM-001", useQty: 2 },
      { sourceType: "assembly", sourceId: "ASM-002", useQty: 1 },
    ],
    processChain: [
      stage(1, "Fit-up", "FIT01", true, { availableQty: 0 }),
      stage(2, "Welding", "WEL01", true, { availableQty: 0 }),
      stage(3, "NDT", "NDT01", true, { availableQty: 0 }),
      stage(4, "Painting", "PNT01", true, { availableQty: 0 }),
    ],
    history: [
      hist("2026-09-04", "ASM-003 created — Project BHEL-001"),
      hist(
        "2026-09-04",
        "Inputs selected: ASM-001 (2 units), ASM-002 (1 unit)",
      ),
      hist(
        "2026-09-04",
        "Awaiting completion of ASM-001 and ASM-002 before production can begin.",
      ),
    ],
  },
  {
    assemblyId: "ASM-004",
    project: "BHEL-002",
    plannedQty: 8,
    createdDate: "2026-08-15",
    inputs: [{ sourceType: "material", sourceId: "PM-AN01", useQty: 8 }],
    processChain: [
      stage(1, "Fit-up", "FIT01", true, {
        availableQty: 8,
        releasedQty: 8,
        lastOperation: {
          performedBy: "R. Kumar",
          supervisedBy: "S. Elango",
          date: "2026-08-16",
          time: "09:00",
          remarks: "All 8 pieces fit up.",
          completedQty: 8,
          rejectedQty: 0,
        },
        lastQc: {
          verifiedBy: "Ravi Shankar",
          remarks: "Approved, cleared for welding.",
          date: "2026-08-16",
          acceptedQty: 8,
          rejectedQty: 0,
        },
      }),
      stage(2, "Welding", "WEL01", true, {
        availableQty: 8,
        releasedQty: 8,
        lastOperation: {
          performedBy: "Manoj Prabhu",
          supervisedBy: "Arun Kumar",
          date: "2026-08-18",
          time: "10:30",
          remarks: "All 8 pieces welded.",
          completedQty: 8,
          rejectedQty: 0,
        },
        lastQc: {
          verifiedBy: "Ravi Shankar",
          remarks: "Weld profile approved.",
          date: "2026-08-18",
          acceptedQty: 8,
          rejectedQty: 0,
        },
      }),
      stage(3, "Grinding", "GRD01", false, {
        availableQty: 8,
        releasedQty: 5,
        pendingOperationQty: 3,
        lastOperation: {
          performedBy: "S. Elango",
          supervisedBy: "Manoj Prabhu",
          date: "2026-08-20",
          time: "13:00",
          remarks: "5 of 8 ground and finished; remaining 3 in progress.",
          completedQty: 5,
          rejectedQty: 0,
        },
      }),
      stage(4, "Painting", "PNT01", true, { availableQty: 5 }),
    ],
    history: [
      hist("2026-08-15", "ASM-004 created — Project BHEL-002"),
      hist("2026-08-15", "Material allocated: Angle 8 Nos (DWG-101)"),
      hist("2026-08-16", "Fit-up started by R. Kumar"),
      hist("2026-08-16", "Fit-up completed — 8 Nos"),
      hist("2026-08-16", "Fit-up QC Approved by Ravi Shankar"),
      hist("2026-08-18", "Welding started by Manoj Prabhu"),
      hist("2026-08-18", "Welding completed — 8 Nos"),
      hist("2026-08-18", "Welding QC Approved by Ravi Shankar"),
      hist(
        "2026-08-20",
        "Grinding started by S. Elango (QC not required for this process)",
      ),
      hist("2026-08-20", "Grinding: 5 of 8 completed — 3 remaining pending"),
      hist("2026-08-20", "5 Nos released to Painting"),
    ],
  },
];

// -------------------------------------------------------------------------
// Derived helpers
// -------------------------------------------------------------------------
const isAssemblyCompleted = (assembly) => {
  const last = assembly.processChain[assembly.processChain.length - 1];
  return last.releasedQty >= assembly.plannedQty;
};

const sourceAvailableQty = (input, assemblies) => {
  if (input.sourceType === "material") {
    const mat = materialById(input.sourceId);
    return mat ? mat.issuedQty : 0;
  }
  const src = assemblies.find((a) => a.assemblyId === input.sourceId);
  if (!src) return 0;
  return isAssemblyCompleted(src) ? input.useQty : 0;
};

const computeMaterialAvailability = (assembly, assemblies) => {
  const requiredQty = assembly.plannedQty;
  if (assembly.inputs.length === 0) {
    return { requiredQty, availableQty: requiredQty, pendingQty: 0 };
  }
  let availableUnits = Infinity;
  assembly.inputs.forEach((inp) => {
    const have = sourceAvailableQty(inp, assemblies);
    const fraction = inp.useQty > 0 ? Math.min(1, have / inp.useQty) : 1;
    availableUnits = Math.min(
      availableUnits,
      Math.floor(fraction * requiredQty)
    );
  });
  availableUnits = Math.max(0, Math.min(availableUnits, requiredQty));
  return {
    requiredQty,
    availableQty: availableUnits,
    pendingQty: requiredQty - availableUnits,
  };
};

const getAssemblyDwgs = (assembly, assemblies, seen = new Set()) => {
  if (!assembly || seen.has(assembly.assemblyId)) return [];
  seen.add(assembly.assemblyId);
  const dwgs = new Set();
  assembly.inputs.forEach((inp) => {
    if (inp.sourceType === "material") {
      const mat = materialById(inp.sourceId);
      if (mat) dwgs.add(mat.dwg);
    } else {
      const nested = assemblies.find((a) => a.assemblyId === inp.sourceId);
      if (nested)
        getAssemblyDwgs(nested, assemblies, seen).forEach((d) => dwgs.add(d));
    }
  });
  return [...dwgs];
};

const getInputDisplayList = (assembly) =>
  assembly.inputs.map((inp) => {
    if (inp.sourceType === "material") {
      const mat = materialById(inp.sourceId);
      return {
        sourceType: "material",
        label: mat.material,
        dwg: mat.dwg,
        qty: inp.useQty,
        unit: mat.unit,
      };
    }
    return {
      sourceType: "assembly",
      label: inp.sourceId,
      dwg: null,
      qty: inp.useQty,
      unit: "unit",
    };
  });

const getInputSummaryLabel = (assembly) => {
  const labels = [
    ...new Set(getInputDisplayList(assembly).map((i) => i.label)),
  ];
  return labels.join(" + ");
};

const getCurrentStageIndex = (assembly) =>
  assembly.processChain.findIndex((s) => s.releasedQty < assembly.plannedQty);

const QC_LABEL = {
  rework: "Rejected",
  qcPending: "Pending",
  notRequired: "Not Required",
  accepted: "Accepted",
  notStarted: "Not Started",
};

const computeQcStatusLabel = (currentStage) => {
  if (!currentStage) return "Accepted";
  if (currentStage.reworkQty > 0) return QC_LABEL.rework;
  if (currentStage.awaitingQcQty > 0) return QC_LABEL.qcPending;
  if (!currentStage.qcRequired) return QC_LABEL.notRequired;
  if (currentStage.releasedQty > 0) return QC_LABEL.accepted;
  return QC_LABEL.notStarted;
};

const computeOverallStatus = (
  assembly,
  materialAvailability,
  currentIndex,
  currentStage
) => {
  if (currentIndex === -1) return "Completed";

  if (currentStage.reworkQty > 0) return "Rework Required";
  if (
    currentStage.awaitingQcQty > 0 &&
    currentStage.pendingOperationQty === 0
  ) {
    return "QC Pending";
  }

  const nothingStartedAnywhere = assembly.processChain.every(
    (s) =>
      s.releasedQty === 0 &&
      s.awaitingQcQty === 0 &&
      s.reworkQty === 0 &&
      !s.lastOperation
  );
  if (nothingStartedAnywhere) {
    return materialAvailability.pendingQty > 0
      ? "Material Pending"
      : "Ready for Production";
  }

  const stageFullyDrainedForNow =
    currentStage.pendingOperationQty === 0 &&
    currentStage.awaitingQcQty === 0 &&
    currentStage.reworkQty === 0;
  if (stageFullyDrainedForNow && currentStage.availableQty === 0) {
    return "Ready for Next Process";
  }
  if (stageFullyDrainedForNow && materialAvailability.pendingQty > 0) {
    return "Material Pending";
  }

  return "In Progress";
};

const buildAssemblyRow = (assembly, assemblies) => {
  const materialAvailability = computeMaterialAvailability(
    assembly,
    assemblies
  );
  const currentIndex = getCurrentStageIndex(assembly);
  const currentStage =
    currentIndex === -1 ? null : assembly.processChain[currentIndex];
  const dwgs = getAssemblyDwgs(assembly, assemblies);
  const overallStatus = computeOverallStatus(
    assembly,
    materialAvailability,
    currentIndex,
    currentStage
  );

  return {
    ...assembly,
    dwgs,
    dwgText: dwgs.join(" "),
    inputSummary: getInputSummaryLabel(assembly),
    materialText: getInputDisplayList(assembly)
      .map((i) => i.label)
      .join(" "),
    thicknessText: assembly.inputs
      .filter((i) => i.sourceType === "material")
      .map((i) => materialById(i.sourceId)?.thickness)
      .join(" "),
    sizeText: assembly.inputs
      .filter((i) => i.sourceType === "material")
      .map((i) => materialById(i.sourceId)?.size)
      .join(" "),
    unit: "Nos",
    ...materialAvailability,
    currentIndex,
    currentStage,
    currentProcessName: currentIndex === -1 ? "—" : currentStage.name,
    qcStatusLabel: computeQcStatusLabel(currentStage),
    overallStatus,
  };
};

// -------------------------------------------------------------------------
// Filters
// -------------------------------------------------------------------------
const FILTER_FIELDS = [
  { key: "assemblyId", label: "Assembly ID", type: "text" },
  { key: "dwgText", label: "DWG", type: "text" },
  { key: "materialText", label: "Material", type: "text" },
  { key: "thicknessText", label: "Thickness", type: "text" },
  { key: "sizeText", label: "Size", type: "text" },
  { key: "unit", label: "Unit", type: "select" },
  { key: "currentProcessName", label: "Current Process", type: "select" },
  { key: "qcStatusLabel", label: "QC Status", type: "select" },
  { key: "overallStatus", label: "Overall Status", type: "select" },
];

const buildOptionsMap = (rows) => {
  const map = {};
  FILTER_FIELDS.forEach((f) => {
    if (f.type === "select") {
      map[f.key] = [
        ...new Set(rows.map((r) => r[f.key]).filter(Boolean)),
      ].sort();
    }
  });
  return map;
};

const matchesFilters = (row, filters) =>
  FILTER_FIELDS.every((f) => {
    const val = filters[f.key];
    if (!val) return true;
    const rowVal = String(row[f.key] ?? "").toLowerCase();
    return f.type === "select"
      ? rowVal === val.toLowerCase()
      : rowVal.includes(val.toLowerCase());
  });

const matchesSearch = (row, search) => {
  if (!search.trim()) return true;
  const term = search.trim().toLowerCase();
  const fields = ["assemblyId", "project", "dwgText", "materialText"];
  return fields.some((k) =>
    String(row[k] ?? "")
      .toLowerCase()
      .includes(term)
  );
};

// -------------------------------------------------------------------------
// Forms
// -------------------------------------------------------------------------
const emptyStartForm = () => ({
  startedBy: "",
  supervisedBy: "",
  date: today(),
  time: nowTime(),
  remarks: "",
});
const emptyCompleteForm = () => ({
  completedQty: "",
  rejectedQty: "",
  remarks: "",
});
const emptyQcForm = () => ({
  acceptedQty: "",
  rejectedQty: "",
  verifiedBy: "",
  remarks: "",
});
const emptyReworkForm = () => ({
  reworkedQty: "",
  by: "",
  date: today(),
  remarks: "",
  reworkRef: "",
});

export default function ProductionOperation() {
  const navigate = useNavigate();

  const [assemblies, setAssemblies] = useState(initialAssemblies);

  const projectOptions = useMemo(
    () => [...new Set(assemblies.map((a) => a.project))].sort(),
    [assemblies]
  );
  const [selectedProject, setSelectedProject] = useState(projectOptions[0]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [viewAssemblyId, setViewAssemblyId] = useState(null);
  const [actionState, setActionState] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState("");

  // ---------------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------------
  const projectRows = useMemo(
    () =>
      assemblies
        .filter((a) => a.project === selectedProject)
        .map((a) => buildAssemblyRow(a, assemblies)),
    [assemblies, selectedProject]
  );

  const filteredRows = useMemo(
    () =>
      projectRows.filter(
        (r) => matchesFilters(r, filters) && matchesSearch(r, search)
      ),
    [projectRows, filters, search]
  );

  const filterOptions = useMemo(
    () => buildOptionsMap(projectRows),
    [projectRows]
  );

  const viewAssembly = viewAssemblyId
    ? buildAssemblyRow(
        assemblies.find((a) => a.assemblyId === viewAssemblyId),
        assemblies
      )
    : null;

  const actionAssembly = actionState
    ? assemblies.find((a) => a.assemblyId === actionState.assemblyId)
    : null;
  const actionStage = actionAssembly
    ? actionAssembly.processChain.find(
        (s) => s.sequence === actionState.sequence
      )
    : null;

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------
  const handleProjectChange = (value) => {
    setSelectedProject(value);
    setFilters({});
    setSearch("");
    setFiltersOpen(false);
  };
  const handleFilterChange = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  const openView = (assemblyId) => setViewAssemblyId(assemblyId);
  const closeView = () => setViewAssemblyId(null);
  const jumpToAssembly = (assemblyId) => setViewAssemblyId(assemblyId);

  const openAction = (assemblyId, sequence, mode) => {
    setActionState({ assemblyId, sequence, mode });
    setFormError("");
    if (mode === "start") setForm(emptyStartForm());
    else if (mode === "complete") setForm(emptyCompleteForm());
    else if (mode === "qc") setForm(emptyQcForm());
    else setForm(emptyReworkForm());
  };
  const closeAction = () => {
    setActionState(null);
    setForm({});
    setFormError("");
  };

  const updateStage = (assemblyId, sequence, updater) => {
    setAssemblies((prev) =>
      prev.map((a) =>
        a.assemblyId !== assemblyId
          ? a
          : {
              ...a,
              processChain: a.processChain.map((s) =>
                s.sequence === sequence ? updater(s) : s
              ),
            }
      )
    );
  };
  const cascadeNext = (assemblyId, sequence, deltaQty) => {
    if (deltaQty <= 0) return;
    setAssemblies((prev) =>
      prev.map((a) =>
        a.assemblyId !== assemblyId
          ? a
          : {
              ...a,
              processChain: a.processChain.map((s) =>
                s.sequence === sequence + 1
                  ? { ...s, availableQty: s.availableQty + deltaQty }
                  : s
              ),
            }
      )
    );
  };
  const pushHistory = (assemblyId, event) => {
    setAssemblies((prev) =>
      prev.map((a) =>
        a.assemblyId !== assemblyId
          ? a
          : { ...a, history: [...a.history, hist(today(), event)] }
      )
    );
  };

  const handleSaveStart = () => {
    if (!form.startedBy) return setFormError("Please select Started By.");
    if (!form.supervisedBy) return setFormError("Please select Supervisor.");
    const { assemblyId, sequence } = actionState;
    updateStage(assemblyId, sequence, (s) => ({
      ...s,
      started: true,
      lastOperation: {
        performedBy: form.startedBy,
        supervisedBy: form.supervisedBy,
        date: form.date,
        time: form.time,
        remarks: form.remarks.trim(),
        completedQty: null,
        rejectedQty: null,
      },
    }));
    pushHistory(assemblyId, `${actionStage.name} started by ${form.startedBy}`);
    closeAction();
  };

  const handleSaveComplete = () => {
    const completed = Number(form.completedQty) || 0;
    const rejected = Number(form.rejectedQty) || 0;
    if (completed + rejected <= 0)
      return setFormError("Enter Completed and/or Rejected Quantity.");
    if (completed + rejected > actionStage.pendingOperationQty) {
      return setFormError(
        `Completed + Rejected cannot exceed the pending quantity (${actionStage.pendingOperationQty}).`
      );
    }
    const { assemblyId, sequence } = actionState;
    const qcRequired = actionStage.qcRequired;
    updateStage(assemblyId, sequence, (s) => ({
      ...s,
      started: false,
      pendingOperationQty: s.pendingOperationQty - completed - rejected,
      awaitingQcQty: qcRequired ? s.awaitingQcQty + completed : s.awaitingQcQty,
      releasedQty: qcRequired ? s.releasedQty : s.releasedQty + completed,
      reworkQty: s.reworkQty + rejected,
      lastOperation: {
        ...s.lastOperation,
        completedQty: completed,
        rejectedQty: rejected,
        remarks: form.remarks.trim() || s.lastOperation?.remarks || "",
        completedDate: today(),
      },
    }));
    if (!qcRequired && completed > 0)
      cascadeNext(assemblyId, sequence, completed);
    pushHistory(
      assemblyId,
      `${actionStage.name} completed — ${completed} Nos${
        rejected > 0 ? `, ${rejected} Nos flagged for rework` : ""
      }`
    );
    if (!qcRequired && completed > 0) {
      pushHistory(
        assemblyId,
        `${completed} Nos released to ${nextStageName(
          actionAssembly,
          sequence
        )}`
      );
    }
    if (rejected > 0)
      pushHistory(
        assemblyId,
        `${rejected} Nos sent to Rework (${actionStage.name})`
      );
    closeAction();
  };

  const handleSaveQc = () => {
    const accepted = Number(form.acceptedQty) || 0;
    const rejected = Number(form.rejectedQty) || 0;
    if (!form.verifiedBy) return setFormError("Please select QC Verified By.");
    if (accepted + rejected <= 0)
      return setFormError("Enter Accepted and/or Rejected Quantity.");
    if (accepted + rejected > actionStage.awaitingQcQty) {
      return setFormError(
        `Accepted + Rejected cannot exceed the quantity awaiting QC (${actionStage.awaitingQcQty}).`
      );
    }
    const { assemblyId, sequence } = actionState;
    updateStage(assemblyId, sequence, (s) => ({
      ...s,
      awaitingQcQty: s.awaitingQcQty - accepted - rejected,
      releasedQty: s.releasedQty + accepted,
      reworkQty: s.reworkQty + rejected,
      lastQc: {
        verifiedBy: form.verifiedBy,
        remarks: form.remarks.trim(),
        date: today(),
        acceptedQty: accepted,
        rejectedQty: rejected,
      },
    }));
    if (accepted > 0) cascadeNext(assemblyId, sequence, accepted);
    pushHistory(
      assemblyId,
      `${actionStage.name} QC: ${accepted} Accepted, ${rejected} Rejected by ${form.verifiedBy}`
    );
    if (accepted > 0)
      pushHistory(
        assemblyId,
        `${accepted} Nos released to ${nextStageName(
          actionAssembly,
          sequence
        )}`
      );
    if (rejected > 0)
      pushHistory(
        assemblyId,
        `${rejected} Nos sent to Rework (${actionStage.name})`
      );
    closeAction();
  };

  const handleSaveRework = () => {
    const reworked = Number(form.reworkedQty) || 0;
    if (!form.by) return setFormError("Please select who is confirming this.");
    if (reworked <= 0)
      return setFormError("Enter the quantity marked Done in Rework.");
    if (reworked > actionStage.reworkQty) {
      return setFormError(
        `Quantity cannot exceed the rework pool (${actionStage.reworkQty}).`
      );
    }
    const { assemblyId, sequence } = actionState;
    const qcRequired = actionStage.qcRequired;
    updateStage(assemblyId, sequence, (s) => ({
      ...s,
      reworkQty: s.reworkQty - reworked,
      awaitingQcQty: qcRequired ? s.awaitingQcQty + reworked : s.awaitingQcQty,
      releasedQty: qcRequired ? s.releasedQty : s.releasedQty + reworked,
      lastRework: {
        by: form.by,
        date: form.date,
        remarks: form.remarks.trim(),
        reworkedQty: reworked,
        reworkRef: form.reworkRef.trim(),
      },
    }));
    if (!qcRequired) cascadeNext(assemblyId, sequence, reworked);
    pushHistory(
      assemblyId,
      `Rework marked Done for ${reworked} Nos (${actionStage.name})${
        form.reworkRef.trim() ? ` — ref ${form.reworkRef.trim()}` : ""
      }, confirmed by ${form.by}`
    );
    if (qcRequired)
      pushHistory(
        assemblyId,
        `${reworked} Nos sent back to QC (${actionStage.name})`
      );
    else
      pushHistory(
        assemblyId,
        `${reworked} Nos released to ${nextStageName(
          actionAssembly,
          sequence
        )}`
      );
    closeAction();
  };

  // ---------------- Back Handler ----------------
  function handleBack() {
    navigate("/inventory/material");
  }

  // ---------------- Render ----------------
  return (
    <>
      <Header />
      <div className="material-page">
        <div className="material-content">
          {/* Page Header with Back Button */}
          <div className="page-header-wrap">
            <div className="page-header-left">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={16} strokeWidth={2} />
                Back
              </button>
              <div className="page-header-title-group">
                <h1 className="page-header-title">Production Operation</h1>
                <p className="page-header-subtitle">
                  Execute the assembly process route already defined in
                  Production Assembly Integration — record each stage, route it
                  through QC, and track progress toward final completion. Only
                  assemblies created there appear here.
                </p>
              </div>
            </div>
          </div>

          {/* ===================== PROJECT SELECTOR ===================== */}
          <div className="project-bar">
            <label htmlFor="project-select" className="project-label">
              Project
            </label>
            <select
              id="project-select"
              className="project-select"
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              {projectOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="project-hint">
              Showing integrated assemblies under{" "}
              <strong>{selectedProject}</strong>
            </span>
          </div>

          {/* ===================== ASSEMBLY TABLE ===================== */}
          <div className="panel">
            <FilterPanel
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              onFilterChange={handleFilterChange}
              options={filterOptions}
              onClear={clearFilters}
              open={filtersOpen}
              onToggleOpen={() => setFiltersOpen((o) => !o)}
              resultCount={filteredRows.length}
            />

            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assembly ID</th>
                    <th>Project</th>
                    <th>DWG(s)</th>
                    <th>Input Summary</th>
                    <th>Required Qty</th>
                    <th>Available Qty</th>
                    <th>Pending Qty</th>
                    <th>Current Process</th>
                    <th>QC Status</th>
                    <th>Overall Status</th>
                    <th className="cell-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={11}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🏭</div>
                          <p className="empty-state-title">
                            No Assemblies Found
                          </p>
                          <p className="empty-state-desc">
                            No integrated assembly matches the current project /
                            search / filters. Create one in Production Assembly
                            Integration first.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {filteredRows.map((row) => (
                    <tr key={row.assemblyId}>
                      <td
                        data-label="Assembly ID"
                        className="mono"
                        style={{
                          fontWeight: 600,
                          color: "var(--primary-dark)",
                        }}
                      >
                        {row.assemblyId}
                      </td>
                      <td data-label="Project">{row.project}</td>
                      <td data-label="DWG(s)">{row.dwgs.join(" + ")}</td>
                      <td data-label="Input Summary">
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            background: "var(--primary-soft)",
                            color: "var(--primary)",
                            border: "1px solid var(--primary-border)",
                            borderRadius: 999,
                            fontWeight: 500,
                            fontSize: 12,
                          }}
                        >
                          {row.inputSummary}
                        </span>
                      </td>
                      <td data-label="Required Qty" className="cell-num">
                        {row.requiredQty}
                      </td>
                      <td data-label="Available Qty" className="cell-num">
                        {row.availableQty}
                      </td>
                      <td data-label="Pending Qty" className="cell-num">
                        {row.pendingQty > 0 ? (
                          <span className="pending-qty">
                            ⚠ {row.pendingQty}
                          </span>
                        ) : (
                          0
                        )}
                      </td>
                      <td data-label="Current Process">
                        {row.currentProcessName}
                      </td>
                      <td data-label="QC Status">
                        <QcStatusBadge status={row.qcStatusLabel} />
                      </td>
                      <td data-label="Overall Status">
                        <OverallStatusBadge status={row.overallStatus} />
                      </td>
                      <td data-label="Action">
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                            alignItems: "flex-start",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openView(row.assemblyId)}
                            className="btn btn-secondary btn-sm"
                            style={{ width: 30, height: 30, padding: 0 }}
                            title="View Details"
                            aria-label="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          <AssemblyActionButtons
                            row={row}
                            onOpen={openAction}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== EYE VIEW MODAL ===================== */}
          {viewAssembly && (
            <div className="modal-overlay" onClick={closeView}>
              <div
                className="modal-box modal-box-wide"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-head">
                  <div>
                    <h2 className="modal-title">{viewAssembly.assemblyId}</h2>
                    <p className="modal-subtitle">
                      Project : <strong>{viewAssembly.project}</strong> · DWG(s) :{" "}
                      <strong>{viewAssembly.dwgs.join(" + ")}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeView}
                    className="modal-close-btn"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body">
                  <EyeViewBody
                    assembly={viewAssembly}
                    assemblies={assemblies}
                    onJump={jumpToAssembly}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeView}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== ACTION MODAL ===================== */}
          {actionState && actionAssembly && actionStage && (
            <div className="modal-overlay">
              <div className="modal-box">
                <div className="modal-head">
                  <div>
                    <h2 className="modal-title">
                      {ACTION_TITLES[actionState.mode]}
                    </h2>
                    <p className="modal-subtitle">
                      Assembly : <strong>{actionAssembly.assemblyId}</strong> ·
                      Process :{" "}
                      <strong>
                        {actionStage.name} - {actionStage.id}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAction}
                    className="modal-close-btn"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body">
                  <ActionModalBody
                    assembly={actionAssembly}
                    stage={actionStage}
                    mode={actionState.mode}
                    form={form}
                    setForm={setForm}
                  />
                  {formError && <div className="error-box">{formError}</div>}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeAction}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={
                      {
                        start: handleSaveStart,
                        complete: handleSaveComplete,
                        qc: handleSaveQc,
                        rework: handleSaveRework,
                      }[actionState.mode]
                    }
                    className="btn btn-primary"
                  >
                    {ACTION_SAVE_LABELS[actionState.mode]}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const ACTION_TITLES = {
  start: "Start Process",
  complete: "Complete Process",
  qc: "QC Verification",
  rework: "Rework Done — Confirm & Continue",
};
const ACTION_SAVE_LABELS = {
  start: "Save & Start",
  complete: "Save Completion",
  qc: "Save QC Verification",
  rework: "Confirm Done & Continue",
};

const nextStageName = (assembly, sequence) => {
  const next = assembly.processChain.find((s) => s.sequence === sequence + 1);
  return next ? next.name : "Final Completion";
};

// =========================================================================
// Filter Panel
// =========================================================================
function FilterPanel({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  options,
  onClear,
  open,
  onToggleOpen,
  resultCount,
}) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="panel-toolbar">
      <div className="panel-toolbar-search">
        <Search size={14} />
        <input
          type="text"
          value={search}
          placeholder="Search Assembly ID, Project, DWG, Material..."
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={onToggleOpen}
        className={`btn btn-secondary btn-sm ${
          open ? "btn-outline-active" : ""
        }`}
      >
        Filters
        {activeFilterCount > 0 && (
          <span
            style={{
              background: "var(--primary)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "0 6px",
              borderRadius: 999,
            }}
          >
            {activeFilterCount}
          </span>
        )}
      </button>
      <button type="button" onClick={onClear} className="btn-link">
        Clear Filters
      </button>

      {open && (
        <div className="filters-grid">
          {FILTER_FIELDS.map((f) => (
            <div className="form-field" key={f.key}>
              <label>{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={filters[f.key] || ""}
                  onChange={(e) => onFilterChange(f.key, e.target.value)}
                >
                  <option value="">All</option>
                  {(options[f.key] || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters[f.key] || ""}
                  placeholder={`Filter by ${f.label}`}
                  onChange={(e) => onFilterChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          margin: "12px 2px 0",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        {resultCount} assembl{resultCount !== 1 ? "ies" : "y"} found
      </p>
    </div>
  );
}

// =========================================================================
// Action buttons
// =========================================================================
function AssemblyActionButtons({ row, onOpen }) {
  if (row.currentIndex === -1) {
    return (
      <span className="locked-pill locked-final">Completed</span>
    );
  }
  const s = row.currentStage;
  if (s.availableQty === 0) {
    return (
      <span className="locked-pill locked-pending">Material Pending</span>
    );
  }

  const buttons = [];
  if (s.reworkQty > 0) {
    buttons.push(
      <button
        key="rework"
        type="button"
        onClick={() => onOpen(row.assemblyId, s.sequence, "rework")}
        className="btn btn-rework btn-sm"
      >
        ⚠ Rework Done? ({s.reworkQty})
      </button>
    );
  }
  if (s.awaitingQcQty > 0) {
    buttons.push(
      <button
        key="qc"
        type="button"
        onClick={() => onOpen(row.assemblyId, s.sequence, "qc")}
        className="btn btn-qc btn-sm"
      >
        ▶ QC Verify ({s.awaitingQcQty})
      </button>
    );
  }
  if (s.pendingOperationQty > 0) {
    buttons.push(
      s.started ? (
        <button
          key="complete"
          type="button"
          onClick={() => onOpen(row.assemblyId, s.sequence, "complete")}
          className="btn btn-primary btn-sm"
        >
          ▶ Complete Process
        </button>
      ) : (
        <button
          key="start"
          type="button"
          onClick={() => onOpen(row.assemblyId, s.sequence, "start")}
          className="btn btn-primary btn-sm"
        >
          ▶ Start Process
        </button>
      )
    );
  }
  if (buttons.length === 0) {
    return (
      <span className="locked-pill locked-pending">Awaiting Next Batch</span>
    );
  }
  return <div className="action-stack">{buttons}</div>;
}

// =========================================================================
// Status badges
// =========================================================================
function OverallStatusBadge({ status }) {
  const map = {
    Planned: "status-badge-neutral",
    "Material Pending": "status-badge-warning",
    "Ready for Production": "status-badge-info",
    "In Progress": "status-badge-info",
    "QC Pending": "status-badge-warning",
    "QC Rejected": "status-badge-danger",
    "Rework Required": "status-badge-danger",
    "Ready for Next Process": "status-badge-purple",
    Completed: "status-badge-success",
  };
  return <span className={`status-badge ${map[status] || ""}`}>{status}</span>;
}

function QcStatusBadge({ status }) {
  const map = {
    "Not Started": "qc-badge-notstarted",
    Pending: "qc-badge-pending",
    Accepted: "qc-badge-accepted",
    Rejected: "qc-badge-rejected",
    "Not Required": "qc-badge-na",
  };
  return <span className={`qc-badge ${map[status] || ""}`}>{status}</span>;
}

// =========================================================================
// Process route timeline
// =========================================================================
function ProcessRouteTimeline({ assembly }) {
  const currentIndex = getCurrentStageIndex(assembly);
  return (
    <ol className="process-chain">
      {assembly.processChain.map((s, idx) => {
        let stepClass = "process-chain-step";
        let icon = "○";
        let tag = null;

        const fullyReleased = s.releasedQty >= assembly.plannedQty;
        if (fullyReleased) {
          stepClass += " process-chain-done";
          icon = "✓";
        } else if (s.reworkQty > 0) {
          stepClass += " process-chain-rework";
          icon = "⚠";
          tag = "REWORK";
        } else if (idx === currentIndex) {
          stepClass += " process-chain-current";
          icon = "●";
          tag =
            s.awaitingQcQty > 0 && s.pendingOperationQty === 0
              ? "AWAITING QC"
              : "CURRENT";
        } else {
          stepClass += " process-chain-locked";
          icon = s.availableQty === 0 ? "🔒" : "○";
        }

        return (
          <li key={s.sequence} className={stepClass}>
            <span className="process-chain-icon">{icon}</span>
            <span className="process-chain-seq">{s.sequence}</span>
            <span className="process-chain-name">{s.name}</span>
            <span className="process-chain-id">{s.id}</span>
            <span className="process-chain-qty">
              {s.releasedQty}/{assembly.plannedQty} released
              {s.reworkQty > 0 ? ` · ${s.reworkQty} in rework` : ""}
              {s.awaitingQcQty > 0 ? ` · ${s.awaitingQcQty} awaiting QC` : ""}
            </span>
            {!s.qcRequired && (
              <span className="process-chain-noqc">QC not required</span>
            )}
            {tag && <span className="process-chain-tag">{tag}</span>}
          </li>
        );
      })}
    </ol>
  );
}

// =========================================================================
// Action modal body
// =========================================================================
function ActionModalBody({ assembly, stage: s, mode, form, setForm }) {
  return (
    <>
      <div className="modal-card">
        <h3 className="modal-card-title">Assembly &amp; Process</h3>
        <div className="readonly-grid">
          <ReadonlyField
            label="Assembly"
            value={assembly.assemblyId}
            emphasize
          />
          <ReadonlyField label="Project" value={assembly.project} />
          <ReadonlyField label="Process" value={s.name} />
          <ReadonlyField label="Process ID" value={s.id} />
          <ReadonlyField label="Planned Quantity" value={assembly.plannedQty} />
          <ReadonlyField label="Available At This Stage" value={s.availableQty} />
          {mode === "complete" && (
            <ReadonlyField
              label="Pending Operation Qty"
              value={s.pendingOperationQty}
              emphasize
            />
          )}
          {mode === "qc" && (
            <ReadonlyField
              label="Awaiting QC Qty"
              value={s.awaitingQcQty}
              emphasize
            />
          )}
          {mode === "rework" && (
            <ReadonlyField
              label="Rework Pool Qty"
              value={s.reworkQty}
              emphasize
            />
          )}
        </div>
      </div>

      {mode === "start" && (
        <div className="modal-card">
          <h3 className="modal-card-title">Production Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Started By</label>
              <select
                value={form.startedBy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startedBy: e.target.value }))
                }
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp}>{emp}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Supervisor</label>
              <select
                value={form.supervisedBy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supervisedBy: e.target.value }))
                }
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp}>{emp}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Start Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label>Start Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, time: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label>Remarks</label>
            <textarea
              rows={3}
              placeholder="Optional notes..."
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
        </div>
      )}

      {mode === "complete" && (
        <div className="modal-card">
          <h3 className="modal-card-title">Process Completion</h3>
          <p className="modal-card-subtitle">
            Partial completion is supported — enter only what is actually done.
            The remainder stays pending at this stage and does not move forward.
          </p>
          <div className="form-grid">
            <div className="form-field">
              <label>Completed Quantity</label>
              <input
                type="number"
                min="0"
                value={form.completedQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, completedQty: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label>Rejected Quantity (needs rework)</label>
              <input
                type="number"
                min="0"
                value={form.rejectedQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rejectedQty: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label>Remarks</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
          <p className="modal-card-footnote">
            {s.qcRequired
              ? "Completed quantity moves to QC Pending — it does not advance on its own."
              : "This process has no QC requirement, so completed quantity is released straight to the next process."}
          </p>
        </div>
      )}

      {mode === "qc" && (
        <div className="modal-card">
          <h3 className="modal-card-title">QC Verification</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Accepted Quantity</label>
              <input
                type="number"
                min="0"
                value={form.acceptedQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, acceptedQty: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label>Rejected Quantity</label>
              <input
                type="number"
                min="0"
                value={form.rejectedQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rejectedQty: e.target.value }))
                }
              />
            </div>
            <div className="form-field form-field-full">
              <label>QC Verified By</label>
              <select
                value={form.verifiedBy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, verifiedBy: e.target.value }))
                }
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp}>{emp}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label>QC Remarks</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
          <p className="modal-card-footnote">
            Accepted quantity is released to{" "}
            <strong>{nextStageName(assembly, s.sequence)}</strong>. Rejected
            quantity moves to <strong>Rework Required</strong> and will not
            advance until it is marked Done in the Rework module and QC accepts
            it.
          </p>
        </div>
      )}

      {mode === "rework" && (
        <div className="modal-card modal-card-rework">
          <h3 className="modal-card-title">Rework Done — Confirm &amp; Continue</h3>
          <p className="modal-card-subtitle">
            The rework itself is carried out in the Rework module, not here.
            This step confirms it has been marked <strong>Done</strong> there so{" "}
            {assembly.assemblyId} can continue.
          </p>
          <div className="form-grid">
            <div className="form-field">
              <label>Confirmed By</label>
              <select
                value={form.by}
                onChange={(e) => setForm((f) => ({ ...f, by: e.target.value }))}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp}>{emp}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Date Confirmed</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label>Quantity Marked Done</label>
              <input
                type="number"
                min="0"
                value={form.reworkedQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reworkedQty: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label>Rework Reference (optional)</label>
              <input
                type="text"
                placeholder="Job / ticket no. in Rework module"
                value={form.reworkRef}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reworkRef: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label>Remarks</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
          <p className="modal-card-footnote">
            {s.qcRequired
              ? "This quantity goes back through QC before it can move forward."
              : "This process has no QC requirement, so this quantity is released straight to the next process."}
          </p>
        </div>
      )}
    </>
  );
}

// =========================================================================
// Eye view
// =========================================================================
function EyeViewBody({ assembly, assemblies, onJump }) {
  const materialAvailability = computeMaterialAvailability(
    assembly,
    assemblies
  );
  const currentIndex = getCurrentStageIndex(assembly);
  const currentStage =
    currentIndex === -1 ? null : assembly.processChain[currentIndex];
  const overallStatus = computeOverallStatus(
    assembly,
    materialAvailability,
    currentIndex,
    currentStage
  );
  const dwgs = getAssemblyDwgs(assembly, assemblies);
  const inputs = getInputDisplayList(assembly);

  return (
    <>
      {/* SECTION 1 */}
      <div className="modal-card">
        <h3 className="modal-card-title">1. Assembly Information</h3>
        <div className="readonly-grid">
          <ReadonlyField
            label="Assembly ID"
            value={assembly.assemblyId}
            emphasize
          />
          <ReadonlyField label="Project" value={assembly.project} />
          <ReadonlyField label="DWG(s)" value={dwgs.join(" + ")} />
          <ReadonlyField label="Created Date" value={assembly.createdDate} />
          <ReadonlyField
            label="Planned / Required Quantity"
            value={assembly.plannedQty}
          />
          <ReadonlyField
            label="Available Quantity"
            value={materialAvailability.availableQty}
          />
          <ReadonlyField
            label="Pending Quantity"
            value={materialAvailability.pendingQty}
          />
          <ReadonlyField
            label="Overall Status"
            value={overallStatus}
            emphasize
          />
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="modal-card">
        <h3 className="modal-card-title">
          2. Original Integration (read only)
        </h3>
        <p className="modal-card-subtitle">
          The material / BOM / PO trail behind every input this assembly was
          built from.
        </p>
        <div className="integration-list">
          {assembly.inputs.map((inp, idx) => {
            if (inp.sourceType === "material") {
              const mat = materialById(inp.sourceId);
              return (
                <div className="modal-card modal-card-nested" key={idx}>
                  <div className="readonly-grid">
                    <ReadonlyField label="Project" value={mat.project} />
                    <ReadonlyField label="DWG" value={mat.dwg} />
                    <ReadonlyField
                      label="BOM Description"
                      value={mat.bomDescription}
                    />
                    <ReadonlyField label="PO" value={mat.poNumber} />
                    <ReadonlyField
                      label="PO Description"
                      value={mat.poDescription}
                    />
                    <ReadonlyField label="Material" value={mat.material} />
                    <ReadonlyField label="Thickness" value={mat.thickness} />
                    <ReadonlyField label="Size" value={mat.size} />
                    <ReadonlyField label="Required" value={mat.requiredQty} />
                    <ReadonlyField
                      label="Received (GRN)"
                      value={mat.receivedQty}
                    />
                    <ReadonlyField label="Issued" value={mat.issuedQty} />
                    <ReadonlyField
                      label="Allocated to Assembly"
                      value={`${inp.useQty} ${mat.unit}`}
                      emphasize
                    />
                  </div>
                </div>
              );
            }
            const nested = assemblies.find(
              (a) => a.assemblyId === inp.sourceId
            );
            return (
              <div className="modal-card modal-card-nested" key={idx}>
                <div className="readonly-grid">
                  <ReadonlyField
                    label="Sourced From"
                    value={inp.sourceId}
                    emphasize
                  />
                  <ReadonlyField
                    label="Status"
                    value={
                      nested
                        ? computeOverallStatusLabelOnly(nested, assemblies)
                        : "—"
                    }
                  />
                  <ReadonlyField
                    label="Units Used"
                    value={`${inp.useQty} unit(s)`}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => onJump(inp.sourceId)}
                >
                  Open {inp.sourceId} for full trail
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 */}
      <div className="modal-card">
        <h3 className="modal-card-title">3. Assembly Inputs</h3>
        <div className="pieces-table-wrap">
          <table className="pieces-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>DWG</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.label}</td>
                  <td>
                    {i.sourceType === "assembly" ? "Assembly" : "Material"}
                  </td>
                  <td>{i.dwg || "—"}</td>
                  <td>
                    {i.qty} {i.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="modal-card-footnote">
          Full traceability is preserved — individual source materials remain
          visible here even though production now operates on{" "}
          {assembly.assemblyId} as a whole.
        </p>
      </div>

      {/* SECTION 4 */}
      <div className="modal-card">
        <h3 className="modal-card-title">4. Assembly Process Timeline</h3>
        <p className="modal-card-subtitle">
          Route defined in Production Assembly Integration — executed here,
          never redefined.
        </p>
        <ProcessRouteTimeline assembly={assembly} />
      </div>

      {/* SECTION 5 */}
      <div className="modal-card">
        <h3 className="modal-card-title">5. Current Process</h3>
        {currentIndex === -1 ? (
          <p className="modal-card-subtitle">
            All planned quantity has cleared every stage. {assembly.assemblyId}{" "}
            has reached <strong>Completed</strong>.
          </p>
        ) : (
          <div className="readonly-grid">
            <ReadonlyField
              label="Process"
              value={currentStage.name}
              emphasize
            />
            <ReadonlyField label="Process ID" value={currentStage.id} />
            <ReadonlyField
              label="Available At Stage"
              value={currentStage.availableQty}
            />
            <ReadonlyField
              label="Pending Operation"
              value={currentStage.pendingOperationQty}
            />
            <ReadonlyField
              label="Awaiting QC"
              value={currentStage.awaitingQcQty}
            />
            <ReadonlyField label="Released" value={currentStage.releasedQty} />
            {currentStage.lastOperation?.performedBy && (
              <>
                <ReadonlyField
                  label="Last Performed By"
                  value={currentStage.lastOperation.performedBy}
                />
                <ReadonlyField
                  label="Last Supervised By"
                  value={currentStage.lastOperation.supervisedBy}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* SECTION 6 */}
      <div className="modal-card">
        <h3 className="modal-card-title">6. QC Verification</h3>
        {currentIndex !== -1 && currentStage.lastQc ? (
          <div className="readonly-grid">
            <ReadonlyField
              label="QC Status"
              value={computeQcStatusLabel(currentStage)}
            />
            <ReadonlyField
              label="QC Verified By"
              value={currentStage.lastQc.verifiedBy}
            />
            <ReadonlyField
              label="Accepted Qty"
              value={currentStage.lastQc.acceptedQty}
            />
            <ReadonlyField
              label="Rejected Qty"
              value={currentStage.lastQc.rejectedQty}
            />
            <ReadonlyField
              label="QC Remarks"
              value={currentStage.lastQc.remarks || "—"}
            />
            <ReadonlyField label="QC Date" value={currentStage.lastQc.date} />
          </div>
        ) : currentIndex !== -1 && !currentStage.qcRequired ? (
          <p className="modal-card-subtitle">
            QC is not required for {currentStage.name}.
          </p>
        ) : (
          <p className="modal-card-subtitle">
            No QC verification recorded yet for this stage.
          </p>
        )}
      </div>

      {/* SECTION 7 */}
      {currentIndex !== -1 &&
        (currentStage.reworkQty > 0 || currentStage.lastRework) && (
          <div className="modal-card modal-card-rework">
            <h3 className="modal-card-title">7. Rework Information</h3>
            <div className="readonly-grid">
              <ReadonlyField
                label="Currently In Rework"
                value={currentStage.reworkQty}
                emphasize
              />
              <ReadonlyField
                label="Reason"
                value={
                  currentStage.lastQc?.remarks ||
                  currentStage.lastOperation?.remarks ||
                  "—"
                }
              />
              {currentStage.lastRework && (
                <>
                  <ReadonlyField
                    label="Last Confirmed By"
                    value={currentStage.lastRework.by}
                  />
                  <ReadonlyField
                    label="Last Qty Marked Done"
                    value={currentStage.lastRework.reworkedQty}
                  />
                  <ReadonlyField
                    label="Date Confirmed"
                    value={currentStage.lastRework.date}
                  />
                  <ReadonlyField
                    label="Rework Reference"
                    value={currentStage.lastRework.reworkRef || "—"}
                  />
                </>
              )}
            </div>
            {currentStage.reworkQty > 0 && (
              <p className="modal-card-footnote">
                This quantity cannot proceed to{" "}
                <strong>
                  {nextStageName(assembly, currentStage.sequence)}
                </strong>{" "}
                until it is marked Done in the Rework module and QC accepts it.
              </p>
            )}
          </div>
        )}

      {/* SECTION 8 */}
      <div className="modal-card">
        <h3 className="modal-card-title">8. Production History</h3>
        {assembly.history.length === 0 ? (
          <p className="modal-card-subtitle">
            No production history recorded yet.
          </p>
        ) : (
          <ol className="history-list">
            {assembly.history.map((h, idx) => (
              <li key={idx} className="history-item">
                <span className="history-date">{h.date}</span>
                <span className="history-event">{h.event}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

function computeOverallStatusLabelOnly(assembly, assemblies) {
  const materialAvailability = computeMaterialAvailability(
    assembly,
    assemblies
  );
  const currentIndex = getCurrentStageIndex(assembly);
  const currentStage =
    currentIndex === -1 ? null : assembly.processChain[currentIndex];
  return computeOverallStatus(
    assembly,
    materialAvailability,
    currentIndex,
    currentStage
  );
}

// =========================================================================
// Small shared bits
// =========================================================================
function ReadonlyField({ label, value, emphasize }) {
  return (
    <div className="readonly-field">
      <label className="readonly-label">{label}</label>
      <div
        className={`readonly-value ${
          emphasize ? "readonly-value-emphasis" : ""
        }`}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}