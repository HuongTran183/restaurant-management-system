from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_MARKDOWN = ROOT / "KiemThuS6_markdown_day_du.md"
OUTPUT_DIR = ROOT / "docs" / "testing"
RTM_PATH = OUTPUT_DIR / "baseline-rtm.csv"
SCOPE_PATH = OUTPUT_DIR / "TEST_SCOPE_RECONCILIATION.md"


MODULE_EVIDENCE = {
    "2.1": {
        "module_name": "Quản lí đăng nhập và phân quyền",
        "repo_evidence": (
            "Backend `AuthController`, `UserController`, `AuthenticationService`; "
            "frontend `StaffLoginPage`, `StaffDashboardPage`; regression users seeded via `/api/dev/scenarios/*`."
        ),
        "automation": (
            "Backend integration for login success/failure, logout history, and role-aware endpoint access; "
            "staff login also exercised in Playwright staff journeys."
        ),
        "default_note": "Runnable after seeding workbook-compatible users with a dev-support scenario.",
    },
    "2.2": {
        "module_name": "Quản lí bán hàng",
        "repo_evidence": (
            "Ordering and cashier flows exist in backend ordering/billing services and "
            "frontend staff workbench/cashier components."
        ),
        "automation": "Playwright staff POS and cashier journeys cover the main happy-path loop.",
        "default_note": "Core POS flow is present; promotion/e-invoice split/merge features need explicit gap checks.",
    },
    "2.3": {
        "module_name": "Quản lí bàn và khu vực",
        "repo_evidence": (
            "Backend `AreaController`, `DiningTableController`, `PublicQrController`, `TableSessionController`; "
            "floor overview UI exists in staff dashboard."
        ),
        "automation": "Backend floor integration tests and Playwright staff POS smoke cover the main table/session path.",
        "default_note": "Runnable with baseline demo area/table/QR data.",
    },
    "2.4": {
        "module_name": "Quản lý thực đơn và món ăn",
        "repo_evidence": "Backend `CategoryController`, `MenuItemController`, `PublicMenuController`; public menu and staff add-item flow consume this data.",
        "automation": "Backend public menu integration tests and Playwright QR/staff flows cover menu availability.",
        "default_note": "Runnable for menu CRUD/state flows that already surface through backend/public UI.",
    },
    "2.5": {
        "module_name": "Đặt món qua QR tại bàn",
        "repo_evidence": "Public QR resolve + ordering controllers, QR frontend route, service request flow, and seeded demo table.",
        "automation": "Playwright customer QR journeys and backend public ordering integration tests cover the core loop.",
        "default_note": "Runnable on the seeded demo QR/table session topology.",
    },
    "2.6": {
        "module_name": "Quản lí đặt bàn",
        "repo_evidence": "Public reservation controller + reservation queue and host actions in the staff dashboard.",
        "automation": "Playwright reservation create/lookup flows and backend reservation integration tests cover the main path.",
        "default_note": "Runnable for booking lifecycle flows that stay inside the current UI/API surface.",
    },
    "2.7": {
        "module_name": "Quản lý đơn hàng",
        "repo_evidence": "Ordering domain/services/controllers plus staff workbench order actions.",
        "automation": "Backend order workflow tests and Playwright staff/cashier flows cover create-confirm-bill transitions.",
        "default_note": "Runnable for current order lifecycle operations; split/merge remains a gap.",
    },
    "2.8": {
        "module_name": "Thanh toán và hóa đơn",
        "repo_evidence": "Backend `InvoiceController`, `PaymentController`, pricing service, and cashier workbench/payment history flows.",
        "automation": "Backend invoice/pricing tests and Playwright invoice/payment journeys cover the main billing loop.",
        "default_note": "Runnable for invoice creation and payment recording; promotion/e-invoice split/merge needs gap checks.",
    },
    "2.9": {
        "module_name": "Quản lý khách hàng",
        "repo_evidence": "Only basic backend customer CRUD/list API exists (`CustomerController`, `CustomerService`); no dedicated customer UI or loyalty/history engine was found.",
        "automation": "No dedicated automated coverage yet.",
        "default_note": "Mixed scope: basic CRUD is runnable, loyalty/history features are blocked by implementation gap.",
    },
    "2.10": {
        "module_name": "Quản lí khuyến mãi",
        "repo_evidence": "No promotion/voucher controller, service, or staff/public UI was found in the current repo.",
        "automation": "No automated coverage because the feature slice is absent.",
        "default_note": "Blocked by implementation gap.",
    },
    "2.11": {
        "module_name": "Báo cáo và thống kê",
        "repo_evidence": "No reporting/export controller or reporting screen was found in backend/frontend.",
        "automation": "No automated coverage because the feature slice is absent.",
        "default_note": "Blocked by implementation gap.",
    },
}


AUTOMATION_SUPPORT = {
    "TC_2.1_001": "Backend auth integration (`AuthApiIntegrationTest.shouldLoginWithSeededAdminAccount`)",
    "TC_2.1_002": "Dev-support baseline login proof for `manager01` (`DevSupportApiIntegrationTest.shouldSeedWorkbookCompatibleRegressionUsersDuringBaselineScenario`)",
    "TC_2.1_003": "Dev-support baseline login proof for `waiter01` (`DevSupportApiIntegrationTest.shouldSeedWorkbookCompatibleRegressionUsersDuringBaselineScenario`)",
    "TC_2.1_004": "Dev-support baseline login proof for `cashier01` (`DevSupportApiIntegrationTest.shouldSeedWorkbookCompatibleRegressionUsersDuringBaselineScenario`)",
    "TC_2.1_005": "Backend auth negative-path coverage (`AuthApiIntegrationTest.shouldRejectInvalidPassword`)",
    "TC_2.1_006": "Backend auth negative-path coverage (`AuthApiIntegrationTest.shouldRejectUnknownUsername`)",
    "TC_2.1_007": "Backend validation coverage (`AuthApiIntegrationTest.shouldRejectBlankCredentials`)",
    "TC_2.1_012": "Staff login/logout loop is exercised in Playwright staff flows plus backend logout API test.",
    "TC_2.1_013": "Backend logout history coverage (`AuthApiIntegrationTest.shouldWriteLogoutTimestampForLatestSession`)",
    "TC_2.1_015": "Role-aware API access coverage (`RoleAccessApiIntegrationTest.shouldSeedWorkbookUsersAndApplyRoleAwareEndpointRestrictions`)",
    "TC_2.1_016": "Role-aware API access coverage (`RoleAccessApiIntegrationTest.shouldSeedWorkbookUsersAndApplyRoleAwareEndpointRestrictions`)",
    "TC_2.1_017": "Role-aware API access coverage (`RoleAccessApiIntegrationTest.shouldSeedWorkbookUsersAndApplyRoleAwareEndpointRestrictions`)",
    "TC_2.1_018": "Role-aware API restriction coverage (`RoleAccessApiIntegrationTest.shouldSeedWorkbookUsersAndApplyRoleAwareEndpointRestrictions`)",
    "TC_2.1_019": "Role-aware API restriction coverage (`RoleAccessApiIntegrationTest.shouldSeedWorkbookUsersAndApplyRoleAwareEndpointRestrictions`)",
    "TC_2.1_020": "Seeded multi-user login history proof (`DevSupportApiIntegrationTest.shouldSeedWorkbookCompatibleRegressionUsersDuringBaselineScenario`)",
}


MODULE_LEVEL_AUTOMATION_HINTS = {
    "2.5": ("quét qr", "truy cập menu", "thêm món vào giỏ", "xác nhận đặt món", "yêu cầu thanh toán"),
    "2.6": ("đặt bàn", "tra cứu", "hủy đặt bàn"),
    "2.7": ("tạo đơn", "chuyển trạng thái", "hủy món", "hủy đơn", "lịch sử thay đổi"),
    "2.8": ("tạo hóa đơn", "thanh toán", "yêu cầu thanh toán"),
}


MIXED_GAP_KEYWORDS = {
    "2.2": {
        "blocked": ("khuyến mãi", "voucher", "combo", "giảm giá", "hóa đơn điện tử", "tách hóa đơn", "gộp hóa đơn"),
        "note": "Promotion/voucher/e-invoice and split-merge billing flows are not implemented in the current POS stack.",
    },
    "2.6": {
        "blocked": ("nhắc lịch", "sms", "email"),
        "note": "Reservation reminder delivery is not implemented in the current repo.",
    },
    "2.7": {
        "blocked": ("tách đơn", "gộp đơn"),
        "note": "Order split/merge flows are not implemented in the current order workflow service/UI.",
    },
    "2.8": {
        "blocked": ("khuyến mãi", "voucher", "combo", "giảm giá", "hóa đơn điện tử", "tách hóa đơn"),
        "note": "Promotion-backed billing, e-invoice delivery, and invoice split flows are not implemented in the current repo.",
    },
    "2.9": {
        "blocked": ("lịch sử dùng bữa", "tích điểm", "phân nhóm"),
        "note": "Only basic customer CRUD/list exists; loyalty/history segmentation features are missing.",
    },
}


TEST_DATA_GROUPS = {
    "2.1": "accounts-and-rbac",
    "2.2": "floor-menu-order-payment",
    "2.3": "floor-menu-order-payment",
    "2.4": "floor-menu-order-payment",
    "2.5": "floor-menu-order-payment",
    "2.6": "reservation-customer-report",
    "2.7": "floor-menu-order-payment",
    "2.8": "floor-menu-order-payment",
    "2.9": "reservation-customer-report",
    "2.10": "floor-menu-order-payment",
    "2.11": "reservation-customer-report",
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("<br>", " ")).strip().lower()


def parse_test_cases(markdown_text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    current_module_code = ""
    current_module_name = ""
    in_test_case_section = False
    module_pattern = re.compile(r"^### 4\.\d+\. Module (?P<code>2\.\d+)\s*[–-]\s*(?P<name>.+)$")

    for raw_line in markdown_text.splitlines():
        line = raw_line.strip()
        if line.startswith("## 4. Sheet: Test-case"):
            in_test_case_section = True
            continue
        if line.startswith("## 5. Sheet: Test-defect"):
            break
        if not in_test_case_section:
            continue

        module_match = module_pattern.match(line)
        if module_match:
            current_module_code = module_match.group("code")
            current_module_name = module_match.group("name").strip()
            continue

        if not line.startswith("|") or current_module_code == "":
            continue
        if line.startswith("| STT") or line.startswith("| ---"):
            continue

        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != 10:
            continue

        rows.append(
            {
                "stt": cells[0],
                "tc_id": cells[1],
                "function": cells[2],
                "description": cells[3],
                "steps": cells[4],
                "data": cells[5],
                "method": cells[6],
                "expected": cells[7],
                "priority": cells[8],
                "source_result": cells[9],
                "module_code": current_module_code,
                "module_name": current_module_name,
            }
        )

    return rows


def classify_case(row: dict[str, str]) -> tuple[str, str]:
    module_code = row["module_code"]
    text = normalize_text(" ".join((row["function"], row["description"], row["expected"])))

    if module_code in {"2.10", "2.11"}:
        return "Blocked", MODULE_EVIDENCE[module_code]["default_note"]

    mixed_gap = MIXED_GAP_KEYWORDS.get(module_code)
    if mixed_gap and any(keyword in text for keyword in mixed_gap["blocked"]):
        return "Blocked", mixed_gap["note"]

    return "Runnable", MODULE_EVIDENCE[module_code]["default_note"]


def automation_hint(row: dict[str, str]) -> str:
    tc_id = row["tc_id"]
    if tc_id in AUTOMATION_SUPPORT:
        return AUTOMATION_SUPPORT[tc_id]

    module_code = row["module_code"]
    text = normalize_text(" ".join((row["function"], row["description"], row["expected"])))
    module_hints = MODULE_LEVEL_AUTOMATION_HINTS.get(module_code, ())
    if any(keyword in text for keyword in module_hints):
        if module_code == "2.5":
            return "Playwright QR journey + backend public ordering integration cover the customer QR happy path."
        if module_code == "2.6":
            return "Playwright reservation create/lookup/cancel flows plus backend reservation integration cover the main lifecycle."
        if module_code == "2.7":
            return "Backend order workflow tests and Playwright staff journeys cover the main order lifecycle."
        if module_code == "2.8":
            return "Backend invoice/pricing tests and Playwright cashier/payment journeys cover the billing happy path."
    return "None"


def execution_status(row: dict[str, str]) -> str:
    classification, _ = classify_case(row)
    if classification == "Blocked":
        return "Blocked"
    if automation_hint(row) != "None":
        return "Automated-backed"
    return "Runnable"


def write_rtm(rows: list[dict[str, str]]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "module_code",
        "module_name",
        "tc_id",
        "priority",
        "method",
        "source_result",
        "execution_status",
        "automation_support",
        "test_data_group",
        "function",
        "description",
        "expected",
        "execution_note",
    ]

    with RTM_PATH.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            _, note = classify_case(row)
            writer.writerow(
                {
                    "module_code": row["module_code"],
                    "module_name": row["module_name"],
                    "tc_id": row["tc_id"],
                    "priority": row["priority"],
                    "method": row["method"],
                    "source_result": row["source_result"],
                    "execution_status": execution_status(row),
                    "automation_support": automation_hint(row),
                    "test_data_group": TEST_DATA_GROUPS[row["module_code"]],
                    "function": row["function"],
                    "description": row["description"],
                    "expected": row["expected"].replace("<br>", " / "),
                    "execution_note": note,
                }
            )


def write_scope_summary(rows: list[dict[str, str]]) -> None:
    counts_by_module: dict[str, Counter[str]] = defaultdict(Counter)
    total_by_module: Counter[str] = Counter()
    for row in rows:
        module_code = row["module_code"]
        total_by_module[module_code] += 1
        counts_by_module[module_code][execution_status(row)] += 1

    lines = [
        "# Test Scope Reconciliation",
        "",
        "Tài liệu này được sinh từ `KiemThuS6_markdown_day_du.md` bằng `python tools/generate_testing_artifacts.py`.",
        "",
        "## Reconciliation Notes",
        "",
        "- Baseline thực thi khóa ở 214 test case theo sheet `Test-case`, khác với con số 365 TC ước lượng trong sheet `Test-plan`.",
        "- Mốc `2.9 Quản lý khách hàng -> Test nâng cao, tích hợp = 5/3/2026` được giữ nguyên như nguồn và cần rà soát lại ở file gốc.",
        "- Workbook-compatible regression users (`admin01`, `manager01`, `waiter01`, `cashier01`) được seed qua `/api/dev/scenarios/*` trong local/test để chạy nhánh RBAC lặp lại được.",
        "",
        "## Module Matrix",
        "",
        "| Module | TCs | Automated-backed | Runnable | Blocked | Repo evidence | Automation & notes |",
        "| --- | ---: | ---: | ---: | ---: | --- | --- |",
    ]

    for module_code in sorted(total_by_module.keys(), key=lambda value: [int(part) for part in value.split(".")]):
        evidence = MODULE_EVIDENCE[module_code]
        lines.append(
            "| {module_code} | {total} | {auto} | {run} | {blocked} | {repo_evidence} | {automation} |".format(
                module_code=module_code,
                total=total_by_module[module_code],
                auto=counts_by_module[module_code]["Automated-backed"],
                run=counts_by_module[module_code]["Runnable"],
                blocked=counts_by_module[module_code]["Blocked"],
                repo_evidence=evidence["repo_evidence"],
                automation=evidence["automation"],
            )
        )

    lines.extend(
        [
            "",
            "## Execution Guidance",
            "",
            "- `Automated-backed`: ưu tiên dùng suite tự động làm smoke/regression rồi mới xác nhận thủ công nếu cần evidence UI sâu hơn.",
            "- `Runnable`: có thể chạy thủ công/API theo hiện trạng repo sau khi seed đúng dữ liệu.",
            "- `Blocked`: không chấm Fail nghiệp vụ; ghi riêng `implementation gap` và không đưa vào pass-rate của vòng test hiện tại.",
        ]
    )

    SCOPE_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    if not SOURCE_MARKDOWN.exists():
        raise FileNotFoundError(f"Missing source markdown: {SOURCE_MARKDOWN}")

    rows = parse_test_cases(SOURCE_MARKDOWN.read_text(encoding="utf-8"))
    if len(rows) != 214:
        raise ValueError(f"Expected 214 test cases from source, got {len(rows)}")

    write_rtm(rows)
    write_scope_summary(rows)

    counts = Counter(execution_status(row) for row in rows)
    print(f"Generated {RTM_PATH.relative_to(ROOT)}")
    print(f"Generated {SCOPE_PATH.relative_to(ROOT)}")
    print(f"Status counts: {dict(counts)}")


if __name__ == "__main__":
    main()
