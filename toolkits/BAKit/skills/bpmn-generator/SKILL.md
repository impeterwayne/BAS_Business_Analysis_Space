---
name: bpmn-generator
description: >-
  Convert business process / Use Case flows into BPMN 2.0 XML (.bpmn) files with
  complete BPMNDiagram (bpmndi:BPMNShape, bpmndi:BPMNEdge, dc:Bounds, di:waypoint)
  coordinates ready to import into Draw.io or Camunda without manual layout.
---
# SKILL: BPMN 2.0 DIAGRAM GENERATOR

## 1. MÔ TẢ (DESCRIPTION)
Kỹ năng chuyển hóa các luồng nghiệp vụ (Use Case Flow) thành sơ đồ quy trình nghiệp vụ BPMN 2.0 định dạng XML. Đầu ra trả về là nội dung mã XML chuẩn BPMN 2.0, được yêu cầu lưu trực tiếp vào file có đuôi mở rộng là `.bpmn`.

## 2. QUY TẮC CÚ PHÁP (SYNTAX RULES - BPMN 2.0 XML)
Hệ thống phải tuân thủ nghiêm ngặt các quy tắc sinh XML cho BPMN 2.0:
* **Chuẩn XML:** Khai báo đầy đủ các namespaces cần thiết (`xmlns:bpmn`, `xmlns:bpmndi`, `xmlns:dc`, `xmlns:di`).
* **Các thành phần cơ bản:** 
  * `<bpmn:startEvent>` và `<bpmn:endEvent>` cho điểm bắt đầu và kết thúc.
  * `<bpmn:task>`, `<bpmn:userTask>`, `<bpmn:serviceTask>` cho các bước thực hiện của người dùng hoặc hệ thống.
  * `<bpmn:exclusiveGateway>`, `<bpmn:parallelGateway>` cho các rẽ nhánh hoặc chạy song song.
  * `<bpmn:sequenceFlow>` để nối các thành phần với nhau.
* **Pools & Lanes (Collaboration):** Nếu có nhiều đối tượng tham gia (Actor/System), sử dụng `<bpmn:collaboration>`, `<bpmn:participant>`, `<bpmn:laneSet>` để phân chia làn (swimlanes).
* **ID và Tên:** Mỗi phần tử phải có thuộc tính `id` duy nhất và thuộc tính `name` rõ ràng (nếu có). 
* **BPMNDiagram (Khối hiển thị):** BẮT BUỘC sinh đầy đủ các phần tử hiển thị (BPMN-DI) cho TOÀN BỘ phần tử BPMN. Bao gồm: `bpmndi:BPMNDiagram`, `bpmndi:BPMNPlane`, `bpmndi:BPMNShape`, `bpmndi:BPMNEdge`, `dc:Bounds`, `di:waypoint`.
  * Mục tiêu: Import vào Draw.io/Camunda là thấy sơ đồ đẹp ngay, không cần auto-layout.
  * **Layout Rules (Quy tắc bố cục):**
    * Hướng (Direction): `Start` -> Nằm bên trái (Left), `End` -> Nằm bên phải (Right).
    * Phân làn (Lane): Actor ở trên, System ở dưới.
    * Khoảng cách (Spacing): Task = 180px, Gateway = 50px, Lane Height = 250px.

## 3. TƯ DUY XÂY DỰNG SƠ ĐỒ (LOGIC FLOW)
Trước khi sinh code XML, hệ thống phải thực hiện phân tích:
1. **Xác định các Actors/Pools/Lanes:** Ai/Hệ thống nào tham gia vào quy trình?
2. **Xác định điểm kích hoạt (Start):** Hành động kích hoạt đầu tiên của Actor là gì?
3. **Phân tích luồng chuẩn (Happy Path):** Nối thẳng từ StartEvent đến các Task nghiệp vụ và đến Success EndEvent.
4. **Chèn các điểm rẽ nhánh (Gateways):** Dựa trên Ràng buộc nghiệp vụ (Business Rules), sử dụng Exclusive Gateway cho các logic If/Else.
5. **Xác định các luồng lỗi (Exception Paths):** Các điểm kết thúc không mong muốn (Error/Fail).

## 4. QUY ĐỊNH ĐẦU RA (OUTPUT RULES)
* **Định dạng file:** LUÔN LUÔN trả về hoặc tạo file có đuôi là `.bpmn` (ví dụ: `quy_trinh_tao_moi.bpmn`).
* **Mã XML hợp lệ:** Đảm bảo XML là well-formed (các thẻ mở phải có thẻ đóng tương ứng).
* **Ngôn ngữ:** Đặt tên (`name`) cho các phần tử sử dụng Tiếng Việt kỹ thuật chuẩn hóa, tuân thủ `language_rules.md` (ví dụ: dùng "Đặc tả" thay vì "Mô tả").
* **Yêu cầu kết xuất (OUTPUT REQUIREMENTS BẮT BUỘC):** Bắt buộc phải sinh thẻ `<bpmndi:BPMNDiagram>` với đủ tọa độ hình học (Shape, Edge, Bounds, waypoints) cho toàn bộ phần tử BPMN.

## 5. MẪU ĐẦU RA (OUTPUT TEMPLATE)
Mã sinh ra phải tuân thủ cấu trúc khung BPMN như sau:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Bắt đầu">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Thực hiện công việc">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:endEvent id="EndEvent_1" name="Kết thúc">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <!-- BẮT BUỘC: Phần tử bpmndi để render sơ đồ đẹp ngay khi import -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <!-- Tọa độ cho StartEvent -->
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="100" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <!-- Tọa độ cho Task -->
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="180" y="78" width="100" height="80" />
      </bpmndi:BPMNShape>
      <!-- Tọa độ cho EndEvent -->
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="330" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <!-- Đường nối (Edge) với các điểm waypoints -->
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="136" y="118" />
        <di:waypoint x="180" y="118" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="280" y="118" />
        <di:waypoint x="330" y="118" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
```
