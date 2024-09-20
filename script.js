let visitors = [];
const ADMIN_PASSWORD = "실용104@";
const STORAGE_KEY = "visitorRecords";

function loadVisitors() {
    const storedVisitors = localStorage.getItem(STORAGE_KEY);
    if (storedVisitors) {
        visitors = JSON.parse(storedVisitors).map(visitor => ({
            ...visitor,
            visitTime: new Date(visitor.visitTime)
        }));
        updateVisitorList();
    }
}

function saveVisitors() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
}

function getCurrentLocation(callback) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ko`)
                .then(response => response.json())
                .then(data => {
                    let location = "알 수 없는 위치";
                    if (data.address) {
                        const address = data.address;
                        const cityDistrict = address.city_district || address.county || address.city || address.town;
                        const neighbourhood = address.neighbourhood || address.suburb || address.village;
                        if (cityDistrict && neighbourhood) {
                            location = `${cityDistrict} ${neighbourhood}`;
                        } else if (cityDistrict) {
                            location = cityDistrict;
                        } else if (neighbourhood) {
                            location = neighbourhood;
                        }
                    }
                    callback(location);
                })
                .catch(error => {
                    console.error("위치 변환 중 오류 발생:", error);
                    callback("알 수 없는 위치");
                });
        }, function(error) {
            console.error("위치 정보를 가져오는 중 오류 발생:", error);
            callback("알 수 없는 위치");
        });
    } else {
        console.log("Geolocation을 지원하지 않는 브라우저입니다.");
        callback("알 수 없는 위치");
    }
}

function addVisitor() {
    console.log("addVisitor 함수 호출됨");
    const name = document.getElementById('name').value;
    const studentID = document.getElementById('studentID').value;
    const major = document.getElementById('major').value;

    console.log("입력값:", name, studentID, major);

    if (name && studentID && major) {
        getCurrentLocation(function(location) {
            const visitor = {
                name,
                studentID,
                major,
                location,
                visitTime: new Date()
            };
            visitors.push(visitor);
            console.log("방문자 추가됨:", visitor);
            updateVisitorList();
            clearInputs();
            saveVisitors();
        });
    } else {
        alert('모든 필드를 입력해주세요.');
    }
}

function updateVisitorList() {
    console.log("updateVisitorList 함수 호출됨");
    const visitorList = document.getElementById('visitorList');
    visitorList.innerHTML = '';
    visitors.forEach((visitor, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${visitor.name}</strong> (${visitor.studentID})<br>
            전공: ${visitor.major}<br>
            위치: ${visitor.location}<br>
            방문 시간: ${visitor.visitTime.toLocaleString()}
            <button onclick="deleteVisitor(${index})">삭제</button>
        `;
        visitorList.appendChild(li);
    });
    console.log("방문자 목록 업데이트됨:", visitors);
}

function clearInputs() {
    document.getElementById('name').value = '';
    document.getElementById('studentID').value = '';
    document.getElementById('major').value = '';
}

function checkAdminPassword(action) {
    const password = prompt(`${action} 작업을 위한 관리자 비밀번호를 입력하세요:`);
    if (password === ADMIN_PASSWORD) {
        return true;
    } else {
        alert("비밀번호가 올바르지 않습니다.");
        return false;
    }
}

function deleteVisitor(index) {
    if (checkAdminPassword("삭제")) {
        visitors.splice(index, 1);
        updateVisitorList();
        saveVisitors();
    }
}

function deleteAllVisitors() {
    if (checkAdminPassword("모두 삭제")) {
        if (confirm('정말로 모든 방문자 기록을 삭제하시겠습니까?')) {
            visitors = [];
            updateVisitorList();
            saveVisitors();
        }
    }
}

function saveToExcel() {
    if (checkAdminPassword("방문자 기록 내보내기")) {
        // 데이터 준비
        const data = [
            ["이름", "학번", "전공", "위치", "방문시간"]
        ];
        visitors.forEach(visitor => {
            data.push([
                visitor.name,
                visitor.studentID,
                visitor.major,
                visitor.location,
                visitor.visitTime.toLocaleString()
            ]);
        });

        // 워크북 생성
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "방문자 기록");

        // 파일 저장
        XLSX.writeFile(wb, "visitor_log.xlsx");
    }
}

// 전역 스코프에 함수들을 노출
window.addVisitor = addVisitor;
window.deleteVisitor = deleteVisitor;
window.deleteAllVisitors = deleteAllVisitors;
window.saveToExcel = saveToExcel;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM 완전히 로드됨");
    loadVisitors(); // 저장된 데이터 불러오기
    
    // 이벤트 리스너 추가
    document.getElementById('addVisitorBtn').addEventListener('click', function() {
        console.log("방문자 추가 버튼 클릭됨");
        addVisitor();
    });
    document.getElementById('saveExcelBtn').addEventListener('click', saveToExcel);
    document.getElementById('deleteAllBtn').addEventListener('click', deleteAllVisitors);
});

// 디버깅을 위한 콘솔 로그 추가
console.log("script.js 로드 완료");
