/**
 * userId(GUID)를 기반으로 결정적(deterministic) 익명 닉네임을 생성합니다.
 * 같은 userId는 항상 같은 닉네임을 반환합니다.
 */

const adjectives = [
    '따뜻한', '조용한', '포근한', '잔잔한', '부드러운',
    '고요한', '반짝이는', '은은한', '소중한', '작은',
    '깊은', '맑은', '푸른', '하얀', '별빛의',
    '새벽의', '봄날의', '가을의', '노을빛', '달빛의',
];

const nouns = [
    '해바라기', '달빛', '바람', '구름', '이슬',
    '별', '나비', '토끼', '고양이', '참새',
    '민들레', '라벤더', '은행잎', '눈송이', '물결',
    '풀잎', '호수', '안개꽃', '돌멩이', '종소리',
];

export function getAnonymousNickname(userId: string): string {
    // userId 문자열에서 간단한 해시 생성
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash);

    const adjIndex = hash % adjectives.length;
    const nounIndex = Math.floor(hash / adjectives.length) % nouns.length;

    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
}
