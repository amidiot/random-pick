// 인원 목록
const participants = [
    '정영수', '양승진', '최창열', '김은정', '이정화', '하치복', '김경태', '황연순',
    '조근일', '이재형', '임소연', '김지혜', '정승후', '나유성', '정현웅', '정희웅',
    '김희승', '곽병현', '윤은호', '김윤회', '석진태', '여도근', '강영은', '이한빈',
    '백현덕', '이종근', '이채령', '최창진', '박정현', '최현빈'
];

// 상품 목록
const prizes = [
    { name: '에어팟', count: 1, grade: 1 },           // 1등상
    { name: '인터불고 식사 2매', count: 1, grade: 2 }, // 2등상
    { name: '술', count: 1, grade: 3 },              // 3등상
    { name: '가습기', count: 5, grade: 0 },
    { name: '빵세트', count: 5, grade: 0 },
    { name: '홍삼', count: 6, grade: 0 },
    { name: '스파클링 와인', count: 6, grade: 0 },
    { name: '베스킨 케잌', count: 5, grade: 0 }
];

// 상태 관리
let shuffledParticipants = [];
let prizeAssignments = [];
let currentIndex = 0;
let results = [];

// DOM 요소
const startScreen = document.getElementById('start-screen');
const drawingScreen = document.getElementById('drawing-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const progressText = document.getElementById('progress-text');
const winnerName = document.getElementById('winner-name');
const prizeSlot = document.getElementById('prize-slot');
const prizeItems = prizeSlot.querySelectorAll('.prize-item');
const gradeBadge = document.getElementById('grade-badge');

// Confetti 관련
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiParticles = [];
let animationId = null;

// Canvas 크기 설정
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Fisher-Yates 셔플 알고리즘
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 상품 배정 초기화
function initializeAssignments() {
    shuffledParticipants = shuffleArray(participants);
    prizeAssignments = [];
    currentIndex = 0;
    results = [];

    // 모든 상품을 배열로 만들기
    const allPrizes = [];
    prizes.forEach(prize => {
        for (let i = 0; i < prize.count; i++) {
            allPrizes.push({
                name: prize.name,
                grade: prize.grade
            });
        }
    });

    // 상품 배열을 완전히 랜덤하게 섞기
    const shuffledPrizes = shuffleArray(allPrizes);

    // 섞인 상품과 섞인 인원을 매칭
    shuffledPrizes.forEach((prize, index) => {
        if (index < shuffledParticipants.length) {
            prizeAssignments.push({
                participant: shuffledParticipants[index],
                prize: prize.name,
                grade: prize.grade
            });
        }
    });
}

// 화면 전환
function showScreen(screen) {
    startScreen.classList.remove('active');
    drawingScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    screen.classList.add('active');
}

// 등급 텍스트 반환
function getGradeText(grade) {
    switch(grade) {
        case 1: return '1등상';
        case 2: return '2등상';
        case 3: return '3등상';
        default: return '일반상품';
    }
}

// 다음 추첨자 미리보기 업데이트
function updateNextParticipant() {
    const nextParticipantName = document.getElementById('next-participant-name');
    const nextIndex = currentIndex + 1; // 현재 추첨 중인 사람의 다음 사람
    if (nextIndex < prizeAssignments.length) {
        nextParticipantName.textContent = prizeAssignments[nextIndex].participant;
    } else {
        nextParticipantName.textContent = '-';
    }
}

// 슬롯머신 효과로 당첨자 표시
function showNextWinner() {
    if (currentIndex >= prizeAssignments.length) {
        showResults();
        return;
    }

    const assignment = prizeAssignments[currentIndex];
    const grade = assignment.grade;

    // 진행 상황 업데이트
    progressText.textContent = `${currentIndex + 1} / ${prizeAssignments.length}`;

    // 당첨자 이름 먼저 표시
    winnerName.textContent = assignment.participant;
    // 등급 배지는 아직 숨김 (상품 공개 시 함께 표시)
    gradeBadge.classList.remove('visible');

    // 다음 추첨자 미리 업데이트 (현재 추첨 중인 사람의 다음 사람)
    updateNextParticipant();

    // 버튼 비활성화
    nextBtn.disabled = true;
    nextBtn.textContent = '추첨 중...';

    // 상품 슬롯머신 효과 시작
    startPrizeSlotMachine(assignment, grade);
}

// 상품 슬롯머신 효과
let slotIntervalId = null;
let currentOffset = 0; // 전역으로 이동

function startPrizeSlotMachine(assignment, grade) {
    // 모든 상품 목록 생성
    const allPrizes = [];
    prizes.forEach(prize => {
        for (let i = 0; i < prize.count; i++) {
            allPrizes.push(prize.name);
        }
    });
    
    // 슬롯 스피닝 클래스 추가
    prizeSlot.classList.add('spinning');
    const winnerCard = document.querySelector('.winner-card');
    winnerCard.className = 'winner-card'; // 추첨 중에는 기본 스타일
    winnerCard.style.opacity = '0.95';
    winnerCard.style.animation = 'none';
    
    // 기존 interval 정리
    if (slotIntervalId) {
        cancelAnimationFrame(slotIntervalId);
        slotIntervalId = null;
    }
    
    // 기존 항목 제거
    prizeSlot.innerHTML = '';
    
    const ITEM_HEIGHT = 64; // 4rem = 64px
    
    // 목표 상품이 중앙에 오도록 항목 배치
    // 앞에 랜덤 상품들을 배치하고, 목표 상품이 마지막에 중앙에 오도록
    const itemsToShow = [];
    
    // 앞에 50개 랜덤 상품 배치
    for (let i = 0; i < 50; i++) {
        const randomIdx = Math.floor(Math.random() * allPrizes.length);
        itemsToShow.push(allPrizes[randomIdx]);
    }
    
    // 목표 상품 배치 (중앙에 올 위치)
    itemsToShow.push(assignment.prize);
    
    // 뒤에 몇 개 더 추가 (슬롯 윈도우 채우기용)
    for (let i = 0; i < 5; i++) {
        const randomIdx = Math.floor(Math.random() * allPrizes.length);
        itemsToShow.push(allPrizes[randomIdx]);
    }
    
    // 항목 생성
    for (let i = 0; i < itemsToShow.length; i++) {
        const item = document.createElement('div');
        item.className = 'prize-item';
        item.textContent = itemsToShow[i];
        prizeSlot.appendChild(item);
    }
    
    // 목표 상품 인덱스 (50번째 = 인덱스 50)
    const targetIndex = 50;
    
    // 초기 위치 (첫 번째 항목이 보이도록)
    const initialOffset = 32; // 첫 항목이 중앙 근처에 오도록
    currentOffset = initialOffset;
    prizeSlot.style.transform = `translateY(${currentOffset}px)`;
    prizeSlot.style.transition = 'none';
    
    // 목표 위치 계산 (목표 상품이 중앙에 오도록)
    // 목표 상품의 중앙 = targetIndex * ITEM_HEIGHT + ITEM_HEIGHT/2 = 50*64 + 32 = 3232px
    // 슬롯 윈도우 중앙 = 64px
    // offset + 3232 = 64 -> offset = 64 - 3232 = -3168
    const finalTargetOffset = 64 - (targetIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2);
    
    // 총 이동 거리
    const totalDistance = initialOffset - finalTargetOffset; // 양수 (아래로 이동해야 하므로)
    
    // 시간 기반 애니메이션 (총 3초)
    const TOTAL_DURATION = 3000;
    const startTime = Date.now();
    
    // 항목 스타일 업데이트 함수
    function updateItemStyles(isFinal = false) {
        const items = prizeSlot.querySelectorAll('.prize-item');
        
        if (!isFinal) {
            // 스크롤 중에는 모든 항목을 동일하게 표시
            items.forEach((item) => {
                item.classList.remove('center', 'near', 'far');
            });
            return;
        }
        
        // 최종 멈춤 후에는 당첨 상품만 하이라이트
        const SLOT_CENTER_Y = 64; // 슬롯 윈도우의 중앙
        
        items.forEach((item, idx) => {
            const itemTop = currentOffset + (idx * ITEM_HEIGHT);
            const itemCenterY = itemTop + (ITEM_HEIGHT / 2);
            const distanceFromCenter = Math.abs(itemCenterY - SLOT_CENTER_Y);
            
            item.classList.remove('center', 'near', 'far');
            
            if (distanceFromCenter < 32) {
                item.classList.add('center');
            } else if (distanceFromCenter < 64) {
                item.classList.add('near');
            } else {
                item.classList.add('far');
            }
        });
    }
    
    // easeOutCubic: 처음엔 빠르게, 끝에서 느려지는 easing 함수
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / TOTAL_DURATION, 1); // 0 ~ 1
        
        // 3초가 지났으면 멈춤
        if (progress >= 1) {
            // 최종 위치로 정확히 설정
            currentOffset = finalTargetOffset;
            prizeSlot.style.transition = 'none';
            prizeSlot.style.transform = `translateY(${currentOffset}px)`;
            
            // 애니메이션 종료
            if (slotIntervalId) {
                cancelAnimationFrame(slotIntervalId);
                slotIntervalId = null;
            }
            
            // 당첨 상품 하이라이트
            setTimeout(() => {
                updateItemStyles(true);
            }, 100);
            
            // 최종 결과 표시
            setTimeout(() => {
                prizeSlot.classList.remove('spinning');
                winnerCard.style.opacity = '1';
                revealWinner(assignment, grade);
            }, 400);
            return;
        }
        
        // easing 적용하여 현재 위치 계산
        const easedProgress = easeOutCubic(progress);
        currentOffset = initialOffset - (totalDistance * easedProgress);
        
        // 스크롤 위치 적용
        prizeSlot.style.transform = `translateY(${currentOffset}px)`;
        
        // 다음 프레임 요청
        slotIntervalId = requestAnimationFrame(animate);
    }
    
    slotIntervalId = requestAnimationFrame(animate);
}

// 당첨자 공개
function revealWinner(assignment, grade) {
    // 최종 상품은 이미 슬롯에 표시되어 있음
    
    // 등급 배지 표시 (추첨 완료 후에만 표시)
    gradeBadge.textContent = getGradeText(grade);
    gradeBadge.className = `grade-badge grade-${grade}`;
    gradeBadge.classList.add('visible');

    // 카드에 등급 클래스 추가 (등급별 스타일 적용)
    const winnerCard = document.querySelector('.winner-card');
    winnerCard.className = `winner-card grade-${grade}`;
    winnerCard.style.animation = 'none';
    
    // 등급별로 다른 애니메이션 적용
    setTimeout(() => {
        if (grade === 1) {
            winnerCard.style.animation = 'cardAppear1st 1s ease-out forwards, pulse1st 1.5s ease-in-out infinite';
        } else if (grade === 2) {
            winnerCard.style.animation = 'cardAppear2nd 0.9s ease-out forwards, pulse2nd 2s ease-in-out infinite';
        } else if (grade === 3) {
            winnerCard.style.animation = 'cardAppear3rd 0.85s ease-out forwards';
        } else {
            winnerCard.style.animation = 'cardAppear 0.8s ease-out forwards';
        }
    }, 10);

    // 결과에 추가
    results.push(assignment);

    // Confetti 효과 (등급별로 다르게)
    triggerConfetti(grade);
    
    // 1등상은 추가 confetti 버스트
    if (grade === 1) {
        setTimeout(() => triggerConfetti(grade), 300);
        setTimeout(() => triggerConfetti(grade), 600);
        setTimeout(() => triggerConfetti(grade), 900);
    } else if (grade === 2) {
        setTimeout(() => triggerConfetti(grade), 400);
        setTimeout(() => triggerConfetti(grade), 800);
    } else if (grade === 3) {
        setTimeout(() => triggerConfetti(grade), 500);
    }

    // 현재 인덱스 증가
    currentIndex++;
    
    // 다음 추첨자 업데이트 및 표시
    const nextParticipantInfo = document.getElementById('next-participant-info');
    if (currentIndex < prizeAssignments.length) {
        // 다음 추첨자가 있으면 표시 (이미 updateNextParticipant에서 currentIndex+1을 사용하므로 자동으로 다음 사람이 표시됨)
        updateNextParticipant();
        nextParticipantInfo.style.display = 'block';
    } else {
        // 마지막 추첨이면 다음 추첨자 영역 숨기기
        nextParticipantInfo.style.display = 'none';
    }

    // 버튼 다시 활성화
    nextBtn.disabled = false;
    if (currentIndex >= prizeAssignments.length) {
        nextBtn.textContent = '결과 보기';
    } else {
        nextBtn.textContent = '다음 추첨';
    }
}

// 결과 화면 표시
function showResults() {
    showScreen(resultScreen);

    // 등급별로 결과 분류
    const grade1Results = results.filter(r => r.grade === 1);
    const grade2Results = results.filter(r => r.grade === 2);
    const grade3Results = results.filter(r => r.grade === 3);
    const grade0Results = results.filter(r => r.grade === 0);

    // 결과 표시
    displayResults('grade-1-results', grade1Results);
    displayResults('grade-2-results', grade2Results);
    displayResults('grade-3-results', grade3Results);
    displayResults('grade-0-results', grade0Results);
}

// 결과 목록 표시
function displayResults(containerId, resultList) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    resultList.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div class="result-item-name">${result.participant}</div>
            <div class="result-item-prize">${result.prize}</div>
        `;
        container.appendChild(item);
    });
}

// Confetti 파티클 클래스
class ConfettiParticle {
    constructor(x, y, grade) {
        this.x = x;
        this.y = y;
        this.grade = grade;
        
        // 등급에 따라 파티클 수와 속도 조절
        const gradeSettings = {
            1: { 
                speed: 18, 
                size: 14, 
                colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#FF69B4', '#FF4500', '#FFFF00', '#FF00FF', '#00FFFF', '#FF0000', '#FFFFFF'],
                shapes: ['rect', 'circle', 'star', 'heart', 'ribbon']
            },
            2: { 
                speed: 14, 
                size: 11, 
                colors: ['#C0C0C0', '#87CEEB', '#4169E1', '#9370DB', '#00CED1', '#1E90FF', '#6495ED', '#7B68EE', '#E6E6FA', '#B0C4DE'],
                shapes: ['rect', 'circle', 'star', 'ribbon']
            },
            3: { 
                speed: 11, 
                size: 9, 
                colors: ['#CD7F32', '#8B4513', '#D2691E', '#FF8C00', '#FFA500', '#FFD700', '#FF8C00', '#DAA520', '#B8860B'],
                shapes: ['rect', 'circle', 'star']
            },
            0: { 
                speed: 8, 
                size: 7, 
                colors: ['#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#FFA07A', '#FFE4B5', '#DDA0DD', '#F0E68C'],
                shapes: ['rect', 'circle']
            }
        };

        const settings = gradeSettings[grade] || gradeSettings[0];
        this.vx = (Math.random() - 0.5) * settings.speed * (1 + Math.random() * 0.8);
        this.vy = (Math.random() - 0.5) * settings.speed * (1 + Math.random() * 0.8) - 5;
        this.size = settings.size + Math.random() * 8;
        this.color = settings.colors[Math.floor(Math.random() * settings.colors.length)];
        this.shape = settings.shapes[Math.floor(Math.random() * settings.shapes.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        this.gravity = 0.15;
        this.life = 1.0;
        // 등급에 따라 생명주기 조절 (낮을수록 오래 살음)
        this.decay = grade === 1 ? 0.002 : grade === 2 ? 0.003 : grade === 3 ? 0.004 : 0.005;
        // 스파클 효과를 위한 변수
        this.sparkle = Math.random();
        this.sparkleSpeed = 0.1 + Math.random() * 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
        
        // 공기 저항 효과
        this.vx *= 0.99;
    }

    draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        
        // 스파클 효과 (깜빡임)
        this.sparkle += this.sparkleSpeed;
        const sparkleAlpha = Math.max(0, this.life) * (0.7 + 0.3 * Math.sin(this.sparkle * Math.PI * 2));
        ctx.globalAlpha = sparkleAlpha;
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            this.drawStar(0, 0, this.size / 2, this.size / 4, 5);
            ctx.fill();
        } else if (this.shape === 'heart') {
            this.drawHeart(0, 0, this.size);
            ctx.fill();
        } else if (this.shape === 'ribbon') {
            this.drawRibbon(0, 0, this.size);
            ctx.fill();
        } else {
            // 사각형 (회전 효과 추가)
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        }
        
        // 1등급은 글로우 효과 추가
        if (this.grade === 1 && this.life > 0.5) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = sparkleAlpha * 0.5;
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    drawStar(cx, cy, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
    }
    
    drawHeart(cx, cy, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy + s / 4);
        ctx.bezierCurveTo(cx, cy - s / 2, cx - s, cy - s / 2, cx - s, cy + s / 4);
        ctx.bezierCurveTo(cx - s, cy + s, cx, cy + s * 1.5, cx, cy + s * 1.5);
        ctx.bezierCurveTo(cx, cy + s * 1.5, cx + s, cy + s, cx + s, cy + s / 4);
        ctx.bezierCurveTo(cx + s, cy - s / 2, cx, cy - s / 2, cx, cy + s / 4);
        ctx.closePath();
    }
    
    drawRibbon(cx, cy, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s / 3);
        ctx.quadraticCurveTo(cx, cy - s, cx + s, cy - s / 3);
        ctx.lineTo(cx + s, cy + s / 3);
        ctx.quadraticCurveTo(cx, cy + s, cx - s, cy + s / 3);
        ctx.closePath();
    }

    isAlive() {
        return this.life > 0 && this.y < canvas.height + 150 && this.x > -100 && this.x < canvas.width + 100;
    }
}

// Confetti 효과 트리거
function triggerConfetti(grade) {
    // 파티클 수를 등급에 따라 크게 차별화
    const particleCount = grade === 1 ? 500 : grade === 2 ? 300 : grade === 3 ? 200 : 100;
    
    // 여러 위치에서 폭발하도록
    const burstCount = grade === 1 ? 8 : grade === 2 ? 5 : grade === 3 ? 4 : 2;
    
    for (let burst = 0; burst < burstCount; burst++) {
        // 1등급은 화면 전체에서 폭발
        let centerX, centerY;
        if (grade === 1) {
            centerX = canvas.width * (0.1 + Math.random() * 0.8);
            centerY = canvas.height * (0.2 + Math.random() * 0.5);
        } else {
            centerX = canvas.width / 2 + (Math.random() - 0.5) * 400;
            centerY = canvas.height / 2 + (Math.random() - 0.5) * 300;
        }
        
        for (let i = 0; i < particleCount / burstCount; i++) {
            const angle = (Math.PI * 2 * i) / (particleCount / burstCount) + Math.random() * 0.5;
            const distance = Math.random() * 80;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            confettiParticles.push(new ConfettiParticle(x, y, grade));
        }
    }
    
    // 1등급은 측면에서도 폭발
    if (grade === 1) {
        // 좌측
        for (let i = 0; i < 50; i++) {
            confettiParticles.push(new ConfettiParticle(0, canvas.height * Math.random(), grade));
        }
        // 우측
        for (let i = 0; i < 50; i++) {
            confettiParticles.push(new ConfettiParticle(canvas.width, canvas.height * Math.random(), grade));
        }
        // 상단
        for (let i = 0; i < 80; i++) {
            confettiParticles.push(new ConfettiParticle(canvas.width * Math.random(), 0, grade));
        }
    }

    if (!animationId) {
        animateConfetti();
    }
}

// Confetti 애니메이션
function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const particle = confettiParticles[i];
        particle.update();
        particle.draw();

        if (!particle.isAlive()) {
            confettiParticles.splice(i, 1);
        }
    }

    if (confettiParticles.length > 0) {
        animationId = requestAnimationFrame(animateConfetti);
    } else {
        animationId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// 이벤트 리스너
startBtn.addEventListener('click', () => {
    initializeAssignments();
    showScreen(drawingScreen);
    
    // 첫 번째 당첨자 정보 표시 (등급 배지는 숨김)
    if (prizeAssignments.length > 0) {
        const firstAssignment = prizeAssignments[0];
        winnerName.textContent = firstAssignment.participant;
        gradeBadge.textContent = ''; // 등급 배지 숨김
        gradeBadge.className = 'grade-badge';
        gradeBadge.classList.remove('visible'); // 등급 배지 숨김
        // 슬롯 초기화 - 모든 항목에 "?" 표시
        prizeItems.forEach((item) => {
            item.textContent = '?';
        });
        prizeSlot.classList.remove('spinning');
        // 중앙 항목이 보이도록 초기 위치 설정
        prizeSlot.style.transform = 'translateY(-96px)'; // 중앙 항목의 중앙이 가이드라인 중앙에 오도록
        prizeSlot.style.transition = 'none';
    }
    
    // 다음 추첨자 표시
    const nextParticipantInfo = document.getElementById('next-participant-info');
    if (prizeAssignments.length > 1) {
        updateNextParticipant();
        nextParticipantInfo.style.display = 'block';
    } else {
        nextParticipantInfo.style.display = 'none';
    }
    
    // 진행 상황 업데이트
    progressText.textContent = `1 / ${prizeAssignments.length}`;
    
    // 버튼 활성화
    nextBtn.disabled = false;
    nextBtn.textContent = '추첨 시작';
});

nextBtn.addEventListener('click', () => {
    showNextWinner();
});

restartBtn.addEventListener('click', () => {
    confettiParticles = [];
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showScreen(startScreen);
});

// ============================================
// 배경 파티클 애니메이션
// ============================================
const bgCanvas = document.getElementById('bg-particles');
const bgCtx = bgCanvas.getContext('2d');
let bgParticles = [];
let bgAnimationId = null;

// 캔버스 크기 설정
function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
resizeBgCanvas();
window.addEventListener('resize', resizeBgCanvas);

// 배경 파티클 클래스
class BgParticle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * bgCanvas.width;
        this.y = Math.random() * bgCanvas.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.02;
        
        // 파티클 타입 (별, 원, 다이아몬드)
        this.type = Math.random() < 0.3 ? 'star' : Math.random() < 0.6 ? 'circle' : 'diamond';
        
        // 색상
        const colors = [
            'rgba(255, 255, 255,',
            'rgba(255, 215, 0,',
            'rgba(255, 182, 193,',
            'rgba(135, 206, 235,',
            'rgba(221, 160, 221,',
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;
        
        // 화면 밖으로 나가면 반대쪽에서 다시 나타남
        if (this.x < -10) this.x = bgCanvas.width + 10;
        if (this.x > bgCanvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = bgCanvas.height + 10;
        if (this.y > bgCanvas.height + 10) this.y = -10;
    }
    
    draw() {
        const pulseOpacity = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
        bgCtx.fillStyle = this.color + pulseOpacity + ')';
        
        bgCtx.save();
        bgCtx.translate(this.x, this.y);
        
        if (this.type === 'star') {
            this.drawStar(0, 0, this.size, this.size / 2, 5);
        } else if (this.type === 'diamond') {
            bgCtx.rotate(Math.PI / 4);
            bgCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            bgCtx.beginPath();
            bgCtx.arc(0, 0, this.size, 0, Math.PI * 2);
            bgCtx.fill();
        }
        
        bgCtx.restore();
    }
    
    drawStar(cx, cy, outerRadius, innerRadius, points) {
        bgCtx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) {
                bgCtx.moveTo(x, y);
            } else {
                bgCtx.lineTo(x, y);
            }
        }
        bgCtx.closePath();
        bgCtx.fill();
    }
}

// 유성 클래스
class ShootingStar {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * bgCanvas.width;
        this.y = -10;
        this.length = Math.random() * 80 + 50;
        this.speed = Math.random() * 10 + 8;
        this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
        this.opacity = 1;
        this.active = false;
        this.timer = Math.random() * 500 + 200; // 랜덤 타이밍으로 등장
    }
    
    update() {
        if (!this.active) {
            this.timer--;
            if (this.timer <= 0) {
                this.active = true;
            }
            return;
        }
        
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.opacity -= 0.01;
        
        if (this.opacity <= 0 || this.y > bgCanvas.height || this.x > bgCanvas.width) {
            this.reset();
        }
    }
    
    draw() {
        if (!this.active) return;
        
        const gradient = bgCtx.createLinearGradient(
            this.x, this.y,
            this.x - Math.cos(this.angle) * this.length,
            this.y - Math.sin(this.angle) * this.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        bgCtx.strokeStyle = gradient;
        bgCtx.lineWidth = 2;
        bgCtx.beginPath();
        bgCtx.moveTo(this.x, this.y);
        bgCtx.lineTo(
            this.x - Math.cos(this.angle) * this.length,
            this.y - Math.sin(this.angle) * this.length
        );
        bgCtx.stroke();
        
        // 유성 머리 부분 글로우
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        bgCtx.shadowColor = 'white';
        bgCtx.shadowBlur = 10;
        bgCtx.fill();
        bgCtx.shadowBlur = 0;
    }
}

// 파티클 초기화
function initBgParticles() {
    bgParticles = [];
    
    // 일반 파티클 100개
    for (let i = 0; i < 100; i++) {
        bgParticles.push(new BgParticle());
    }
    
    // 유성 3개
    for (let i = 0; i < 3; i++) {
        bgParticles.push(new ShootingStar());
    }
}

// 배경 애니메이션
function animateBgParticles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    bgParticles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    bgAnimationId = requestAnimationFrame(animateBgParticles);
}

// 배경 애니메이션 시작
initBgParticles();
animateBgParticles();
