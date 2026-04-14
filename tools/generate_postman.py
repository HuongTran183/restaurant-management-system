import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(r"D:/restaurant-management-system")
POSTMAN_DIR = ROOT / "postman"
def uid():
    return str(uuid.uuid4())
def js(lines):
    return {"listen": "test", "script": {"type": "text/javascript", "exec": lines}}
def req(name, method, path, body=None, noauth=False, tests=None, query=None, formdata=None):
    request = {
        "method": method,
        "url": "{{baseUrl}}" + path,
    }
    headers = []
    if body is not None:
        headers.append({"key": "Content-Type", "value": "application/json"})
        request["body"] = {"mode": "raw", "raw": json.dumps(body, indent=2), "options": {"raw": {"language": "json"}}}
    if formdata is not None:
        request["body"] = {"mode": "formdata", "formdata": formdata}
    if headers:
        request["header"] = headers
    if query:
        request["url"] = {
            "raw": "{{baseUrl}}" + path + "?" + "&".join([f"{k}={v}" for k, v in query]),
            "host": ["{{baseUrl}}"],
            "path": [p for p in path.strip('/').split('/') if p],
            "query": [{"key": k, "value": v} for k, v in query],
        }
    item = {"name": name, "request": request}
    if noauth:
        item["request"]["auth"] = {"type": "noauth"}
    if tests:
        item["event"] = [js(tests)]
    return item
collection = {
    "info": {
        "_postman_id": uid(),
        "name": "Restaurant Management System API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "description": "Full API coverage for current Spring controllers (public, auth, staff, billing, dev support).",
    },
    "auth": {"type": "bearer", "bearer": [{"key": "token", "value": "{{accessToken}}", "type": "string"}]},
    "item": [],
}
collection["item"].append({
    "name": "00 Health",
    "item": [
        req("GET /actuator/health", "GET", "/actuator/health", noauth=True),
    ],
})
collection["item"].append({
    "name": "01 Auth & Identity",
    "item": [
        req("POST /api/auth/login", "POST", "/api/auth/login", {
            "username": "{{adminUsername}}",
            "password": "{{adminPassword}}"
        }, noauth=True, tests=[
            "pm.test('200 OK', function () { pm.response.to.have.status(200); });",
            "var d = pm.response.json();",
            "pm.environment.set('accessToken', d.accessToken);",
            "pm.environment.set('refreshToken', d.refreshToken);",
            "if (d.user && d.user.id) pm.environment.set('currentUserId', String(d.user.id));"
        ]),
        req("POST /api/auth/refresh", "POST", "/api/auth/refresh", {
            "refreshToken": "{{refreshToken}}"
        }, noauth=True, tests=[
            "pm.test('200 OK', function () { pm.response.to.have.status(200); });",
            "var d = pm.response.json();",
            "pm.environment.set('accessToken', d.accessToken);",
            "pm.environment.set('refreshToken', d.refreshToken);"
        ]),
        req("GET /api/auth/me", "GET", "/api/auth/me"),
        req("POST /api/auth/logout", "POST", "/api/auth/logout", {
            "refreshToken": "{{refreshToken}}"
        }, tests=[
            "pm.test('Logout status', function () { pm.expect([200,204]).to.include(pm.response.code); });"
        ]),
        req("POST /api/public/auth/register/customer", "POST", "/api/public/auth/register/customer", {
            "username": "{{customerRegUsername}}",
            "password": "{{customerRegPassword}}",
            "fullName": "{{customerRegFullName}}",
            "email": "{{customerRegEmail}}",
            "phone": "{{customerRegPhone}}"
        }, noauth=True),
        req("POST /api/public/auth/register/staff", "POST", "/api/public/auth/register/staff", {
            "username": "{{staffRegUsername}}",
            "password": "{{staffRegPassword}}",
            "fullName": "{{staffRegFullName}}",
            "email": "{{staffRegEmail}}",
            "role": "WAITER"
        }, noauth=True),
        req("GET /api/users", "GET", "/api/users", query=[("page", "0"), ("size", "20"), ("sort", "createdAt")]),
        req("GET /api/users/{userId}", "GET", "/api/users/{{userId}}"),
        req("POST /api/users", "POST", "/api/users", {
            "username": "{{newUserUsername}}",
            "password": "{{newUserPassword}}",
            "fullName": "{{newUserFullName}}",
            "email": "{{newUserEmail}}",
            "roles": ["WAITER"]
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('userId', String(d.id));",
            "}"
        ]),
        req("PUT /api/users/{userId}", "PUT", "/api/users/{{userId}}", {
            "fullName": "{{newUserFullNameUpdated}}",
            "email": "{{newUserEmail}}",
            "active": True,
            "roles": ["WAITER"]
        }),
    ],
})
collection["item"].append({
    "name": "02 Public APIs",
    "item": [
        req("GET /api/public/menu", "GET", "/api/public/menu", noauth=True),
        req("GET /api/public/qr/{token}", "GET", "/api/public/qr/{{qrToken}}", noauth=True, tests=[
            "if (pm.response.code === 200) {",
            "  var d = pm.response.json();",
            "  if (d.openTableSessionId) pm.environment.set('tableSessionId', String(d.openTableSessionId));",
            "  if (d.tableId) pm.environment.set('tableId', String(d.tableId));",
            "}"
        ]),
        req("POST /api/public/qr/{token}/orders", "POST", "/api/public/qr/{{qrToken}}/orders", {
            "note": "QR order from Postman",
            "items": [{"menuItemId": "{{menuItemId}}", "quantity": 1, "note": "No onion"}]
        }, noauth=True, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('orderId', String(d.id));",
            "  if (d.orderCode) pm.environment.set('orderCode', d.orderCode);",
            "}"
        ]),
        req("GET /api/public/orders/{orderCode}", "GET", "/api/public/orders/{{orderCode}}", noauth=True),
        req("POST /api/public/qr/{token}/service-requests", "POST", "/api/public/qr/{{qrToken}}/service-requests", {
            "orderCode": "{{orderCode}}",
            "requestType": "REQUEST_BILL",
            "note": "Please bring bill"
        }, noauth=True, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('serviceRequestId', String(d.id));",
            "}"
        ]),
        req("POST /api/public/reservations", "POST", "/api/public/reservations", {
            "customerName": "{{reservationCustomerName}}",
            "phone": "{{reservationPhone}}",
            "email": "{{reservationEmail}}",
            "partySize": 2,
            "reservationTime": "{{reservationTime}}",
            "requestedArea": "Main Hall",
            "note": "Window seat if possible"
        }, noauth=True, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('reservationId', String(d.id));",
            "  if (d.reservationCode) pm.environment.set('reservationCode', d.reservationCode);",
            "}"
        ]),
        req("GET /api/public/reservations/{reservationCode}", "GET", "/api/public/reservations/{{reservationCode}}", noauth=True),
        req("POST /api/public/reservations/{reservationCode}/cancel", "POST", "/api/public/reservations/{{reservationCode}}/cancel", {
            "note": "Customer changed plan"
        }, noauth=True),
    ],
})
collection["item"].append({
    "name": "03 Catalog",
    "item": [
        req("GET /api/categories", "GET", "/api/categories", query=[("page", "0"), ("size", "20"), ("sort", "createdAt")]),
        req("POST /api/categories", "POST", "/api/categories", {
            "code": "{{categoryCode}}",
            "name": "{{categoryName}}",
            "description": "Created from Postman",
            "sortOrder": 1,
            "active": True
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('categoryId', String(d.id));",
            "}"
        ]),
        req("GET /api/categories/{categoryId}", "GET", "/api/categories/{{categoryId}}"),
        req("PUT /api/categories/{categoryId}", "PUT", "/api/categories/{{categoryId}}", {
            "code": "{{categoryCode}}",
            "name": "{{categoryNameUpdated}}",
            "description": "Updated from Postman",
            "sortOrder": 2,
            "active": True
        }),
        req("GET /api/menu-items", "GET", "/api/menu-items", query=[("page", "0"), ("size", "20"), ("sort", "createdAt")]),
        req("POST /api/menu-items", "POST", "/api/menu-items", {
            "code": "{{menuItemCode}}",
            "name": "{{menuItemName}}",
            "description": "Created from Postman",
            "price": 15.5,
            "available": True,
            "active": True,
            "categoryId": "{{categoryId}}"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('menuItemId', String(d.id));",
            "}"
        ]),
        req("GET /api/menu-items/{menuItemId}", "GET", "/api/menu-items/{{menuItemId}}"),
        req("PUT /api/menu-items/{menuItemId}", "PUT", "/api/menu-items/{{menuItemId}}", {
            "code": "{{menuItemCode}}",
            "name": "{{menuItemNameUpdated}}",
            "description": "Updated from Postman",
            "price": 16.0,
            "available": True,
            "active": True,
            "categoryId": "{{categoryId}}"
        }),
        req("POST /api/menu-items/{menuItemId}/images", "POST", "/api/menu-items/{{menuItemId}}/images", formdata=[
            {"key": "file", "type": "file", "src": "{{menuImagePath}}"}
        ]),
    ],
})
collection["item"].append({
    "name": "04 Floor",
    "item": [
        req("GET /api/areas", "GET", "/api/areas", query=[("page", "0"), ("size", "20"), ("sort", "createdAt")]),
        req("POST /api/areas", "POST", "/api/areas", {
            "code": "{{areaCode}}",
            "name": "{{areaName}}",
            "description": "Postman area",
            "active": True
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('areaId', String(d.id));",
            "}"
        ]),
        req("GET /api/areas/{areaId}", "GET", "/api/areas/{{areaId}}"),
        req("PUT /api/areas/{areaId}", "PUT", "/api/areas/{{areaId}}", {
            "code": "{{areaCode}}",
            "name": "{{areaNameUpdated}}",
            "description": "Postman area updated",
            "active": True
        }),
        req("GET /api/tables", "GET", "/api/tables", query=[("page", "0"), ("size", "20"), ("sort", "createdAt")]),
        req("POST /api/tables", "POST", "/api/tables", {
            "code": "{{tableCode}}",
            "name": "{{tableName}}",
            "seatCount": 4,
            "status": "AVAILABLE",
            "active": True,
            "areaId": "{{areaId}}"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('tableId', String(d.id));",
            "}"
        ]),
        req("GET /api/tables/{tableId}", "GET", "/api/tables/{{tableId}}"),
        req("PUT /api/tables/{tableId}", "PUT", "/api/tables/{{tableId}}", {
            "code": "{{tableCode}}",
            "name": "{{tableNameUpdated}}",
            "seatCount": 6,
            "status": "AVAILABLE",
            "active": True,
            "areaId": "{{areaId}}"
        }),
        req("GET /api/tables/{tableId}/qr", "GET", "/api/tables/{{tableId}}/qr", tests=[
            "if (pm.response.code === 200) {",
            "  var d = pm.response.json();",
            "  if (d.token) pm.environment.set('qrToken', d.token);",
            "}"
        ]),
        req("POST /api/tables/{tableId}/qr", "POST", "/api/tables/{{tableId}}/qr", {
            "diningTableId": "{{tableId}}",
            "label": "{{qrLabel}}",
            "expiresAt": None
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.token) pm.environment.set('qrToken', d.token);",
            "}"
        ]),
        req("GET /api/table-sessions", "GET", "/api/table-sessions", query=[("page", "0"), ("size", "20")]),
        req("POST /api/table-sessions", "POST", "/api/table-sessions", {
            "diningTableId": "{{tableId}}"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('tableSessionId', String(d.id));",
            "}"
        ]),
        req("GET /api/table-sessions/{sessionId}", "GET", "/api/table-sessions/{{tableSessionId}}"),
        req("POST /api/table-sessions/{sessionId}/close", "POST", "/api/table-sessions/{{tableSessionId}}/close"),
    ],
})
collection["item"].append({
    "name": "05 Reservations (Staff)",
    "item": [
        req("GET /api/reservations", "GET", "/api/reservations", query=[("page", "0"), ("size", "20")]),
        req("POST /api/reservations", "POST", "/api/reservations", {
            "customerName": "{{reservationCustomerName}}",
            "phone": "{{reservationPhone}}",
            "email": "{{reservationEmail}}",
            "partySize": 3,
            "reservationTime": "{{reservationTime}}",
            "requestedArea": "Main Hall",
            "note": "Birthday"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('reservationId', String(d.id));",
            "  if (d.reservationCode) pm.environment.set('reservationCode', d.reservationCode);",
            "}"
        ]),
        req("GET /api/reservations/{reservationId}", "GET", "/api/reservations/{{reservationId}}"),
        req("POST /api/reservations/{reservationId}/confirm", "POST", "/api/reservations/{{reservationId}}/confirm", {
            "internalNote": "Confirmed by phone"
        }),
        req("POST /api/reservations/{reservationId}/check-in", "POST", "/api/reservations/{{reservationId}}/check-in", {
            "diningTableId": "{{tableId}}",
            "internalNote": "Arrived"
        }),
        req("POST /api/reservations/{reservationId}/complete", "POST", "/api/reservations/{{reservationId}}/complete"),
        req("POST /api/reservations/{reservationId}/cancel", "POST", "/api/reservations/{{reservationId}}/cancel", {
            "note": "No show"
        }),
    ],
})
collection["item"].append({
    "name": "06 Ordering & Service",
    "item": [
        req("GET /api/orders", "GET", "/api/orders", query=[("page", "0"), ("size", "20")]),
        req("POST /api/orders", "POST", "/api/orders", {
            "orderType": "DINE_IN",
            "tableSessionId": "{{tableSessionId}}",
            "customerId": None,
            "note": "Staff order"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('orderId', String(d.id));",
            "  if (d.orderCode) pm.environment.set('orderCode', d.orderCode);",
            "  if (d.items && d.items.length > 0 && d.items[0].id) pm.environment.set('orderItemId', String(d.items[0].id));",
            "}"
        ]),
        req("GET /api/orders/{orderId}", "GET", "/api/orders/{{orderId}}", tests=[
            "if (pm.response.code === 200) {",
            "  var d = pm.response.json();",
            "  if (d.items && d.items.length > 0 && d.items[0].id) pm.environment.set('orderItemId', String(d.items[0].id));",
            "}"
        ]),
        req("POST /api/orders/{orderId}/items", "POST", "/api/orders/{{orderId}}/items", {
            "menuItemId": "{{menuItemId}}",
            "quantity": 2,
            "note": "Less spicy"
        }, tests=[
            "if (pm.response.code === 200) {",
            "  var d = pm.response.json();",
            "  if (d.items && d.items.length > 0 && d.items[0].id) pm.environment.set('orderItemId', String(d.items[0].id));",
            "}"
        ]),
        req("PUT /api/orders/{orderId}/items/{orderItemId}", "PUT", "/api/orders/{{orderId}}/items/{{orderItemId}}", {
            "quantity": 3,
            "note": "Updated by Postman",
            "cancelled": False
        }),
        req("POST /api/orders/{orderId}/confirm", "POST", "/api/orders/{{orderId}}/confirm"),
        req("POST /api/orders/{orderId}/cancel", "POST", "/api/orders/{{orderId}}/cancel"),
        req("GET /api/service-requests", "GET", "/api/service-requests", query=[("page", "0"), ("size", "20")]),
        req("POST /api/service-requests", "POST", "/api/service-requests", {
            "tableSessionId": "{{tableSessionId}}",
            "orderId": "{{orderId}}",
            "requestType": "CALL_WAITER",
            "note": "Need extra plate"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('serviceRequestId', String(d.id));",
            "}"
        ]),
        req("POST /api/service-requests/{requestId}/resolve", "POST", "/api/service-requests/{{serviceRequestId}}/resolve"),
    ],
})
collection["item"].append({
    "name": "07 Billing",
    "item": [
        req("GET /api/invoices", "GET", "/api/invoices", query=[("page", "0"), ("size", "20")]),
        req("POST /api/invoices", "POST", "/api/invoices", {
            "orderId": "{{orderId}}"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('invoiceId', String(d.id));",
            "}"
        ]),
        req("GET /api/invoices/{invoiceId}", "GET", "/api/invoices/{{invoiceId}}"),
        req("GET /api/payments", "GET", "/api/payments", query=[("page", "0"), ("size", "20")]),
        req("POST /api/payments", "POST", "/api/payments", {
            "invoiceId": "{{invoiceId}}",
            "method": "CASH",
            "amount": 10.0,
            "note": "Paid via Postman"
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('paymentId', String(d.id));",
            "}"
        ]),
    ],
})
collection["item"].append({
    "name": "08 Customers",
    "item": [
        req("GET /api/customers", "GET", "/api/customers", query=[("page", "0"), ("size", "20")]),
        req("POST /api/customers", "POST", "/api/customers", {
            "fullName": "{{customerName}}",
            "phone": "{{customerPhone}}",
            "email": "{{customerEmail}}",
            "active": True
        }, tests=[
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var d = pm.response.json();",
            "  if (d.id) pm.environment.set('customerId', String(d.id));",
            "}"
        ]),
        req("GET /api/customers/{customerId}", "GET", "/api/customers/{{customerId}}"),
        req("PUT /api/customers/{customerId}", "PUT", "/api/customers/{{customerId}}", {
            "fullName": "{{customerNameUpdated}}",
            "phone": "{{customerPhone}}",
            "email": "{{customerEmail}}",
            "active": True
        }),
    ],
})
collection["item"].append({
    "name": "09 Dev Support (local/test, ADMIN)",
    "item": [
        req("POST /api/dev/reset", "POST", "/api/dev/reset"),
        req("POST /api/dev/scenarios/baseline", "POST", "/api/dev/scenarios/baseline", tests=[
            "if (pm.response.code === 200) {",
            "  var d = pm.response.json();",
            "  if (d.tableId) pm.environment.set('tableId', String(d.tableId));",
            "  if (d.qrToken) pm.environment.set('qrToken', d.qrToken);",
            "  if (d.tableSessionId) pm.environment.set('tableSessionId', String(d.tableSessionId));",
            "  if (d.orderId) pm.environment.set('orderId', String(d.orderId));",
            "  if (d.orderCode) pm.environment.set('orderCode', d.orderCode);",
            "  if (d.invoiceId) pm.environment.set('invoiceId', String(d.invoiceId));",
            "}"
        ]),
        req("POST /api/dev/scenarios/draft-order", "POST", "/api/dev/scenarios/draft-order"),
        req("POST /api/dev/scenarios/pending-bill", "POST", "/api/dev/scenarios/pending-bill"),
        req("POST /api/dev/scenarios/open-invoice", "POST", "/api/dev/scenarios/open-invoice"),
        req("POST /api/dev/scenarios/payment-history", "POST", "/api/dev/scenarios/payment-history"),
    ],
})
exported_at = datetime.now(timezone.utc).isoformat()
def env(name, base_url):
    defaults = {
        "baseUrl": base_url,
        "accessToken": "",
        "refreshToken": "",
        "adminUsername": "admin",
        "adminPassword": "Admin@123456",
        "currentUserId": "",
        "userId": "",
        "customerId": "",
        "categoryId": "",
        "menuItemId": "",
        "areaId": "",
        "tableId": "",
        "tableSessionId": "",
        "qrToken": "",
        "reservationId": "",
        "reservationCode": "",
        "orderId": "",
        "orderCode": "",
        "orderItemId": "",
        "serviceRequestId": "",
        "invoiceId": "",
        "paymentId": "",
        "menuImagePath": "D:/restaurant-management-system/data/storage/menu-items/PHO-DEMO-9b0cbd5b-f06a-47bf-ac7e-91c8341e7916.jpg",
        "customerRegUsername": "customer_demo",
        "customerRegPassword": "Customer@123",
        "customerRegFullName": "Demo Customer",
        "customerRegEmail": "customer.demo@example.com",
        "customerRegPhone": "+840900000001",
        "staffRegUsername": "staff_candidate",
        "staffRegPassword": "Staff@123",
        "staffRegFullName": "Candidate Staff",
        "staffRegEmail": "staff.candidate@example.com",
        "newUserUsername": "waiter_new",
        "newUserPassword": "Waiter@123",
        "newUserFullName": "Waiter New",
        "newUserFullNameUpdated": "Waiter New Updated",
        "newUserEmail": "waiter.new@example.com",
        "reservationCustomerName": "Nguyen Van A",
        "reservationPhone": "+840911111111",
        "reservationEmail": "booking@example.com",
        "reservationTime": "2030-12-01T19:00:00Z",
        "categoryCode": "CAT-POSTMAN",
        "categoryName": "Postman Category",
        "categoryNameUpdated": "Postman Category Updated",
        "menuItemCode": "ITEM-POSTMAN",
        "menuItemName": "Postman Item",
        "menuItemNameUpdated": "Postman Item Updated",
        "areaCode": "AREA-POSTMAN",
        "areaName": "Postman Area",
        "areaNameUpdated": "Postman Area Updated",
        "tableCode": "TB-POSTMAN",
        "tableName": "Postman Table",
        "tableNameUpdated": "Postman Table Updated",
        "qrLabel": "Postman QR",
        "customerName": "Pham Thi B",
        "customerNameUpdated": "Pham Thi B Updated",
        "customerPhone": "+840922222222",
        "customerEmail": "customer.ops@example.com",
    }
    return {
        "id": uid(),
        "name": name,
        "values": [{"key": k, "value": v, "type": "default", "enabled": True} for k, v in defaults.items()],
        "_postman_variable_scope": "environment",
        "_postman_exported_at": exported_at,
        "_postman_exported_using": "GPT-5-Codex",
    }
(POSTMAN_DIR / "restaurant-management-system.postman_collection.json").write_text(json.dumps(collection, indent=2), encoding="utf-8")
(POSTMAN_DIR / "local.postman_environment.json").write_text(json.dumps(env("RMS Local", "http://127.0.0.1:18080"), indent=2), encoding="utf-8")
(POSTMAN_DIR / "docker.postman_environment.json").write_text(json.dumps(env("RMS Docker", "http://127.0.0.1:18080"), indent=2), encoding="utf-8")
readme = '''# Postman Quick Start
Files:
- `postman/restaurant-management-system.postman_collection.json`
- `postman/local.postman_environment.json`
- `postman/docker.postman_environment.json`
## Import
1. Open Postman -> Import.
2. Import the collection file and one environment file.
3. Select the imported environment.
## Run order (recommended)
1. `00 Health`
2. `01 Auth & Identity` -> run `POST /api/auth/login`
3. `09 Dev Support` -> run `POST /api/dev/scenarios/baseline` (local/test profile only)
4. Run other folders as needed.
## Notes
- Collection-level auth is `Bearer {{accessToken}}`.
- Public endpoints are set to `No Auth` per request.
- `menuImagePath` points to an existing sample image in this repo.
- Some write endpoints can return conflict/validation if data already exists; adjust env values if needed.
'''
(POSTMAN_DIR / "README.md").write_text(readme, encoding="utf-8")
print("Generated Postman collection and environments in", POSTMAN_DIR)
