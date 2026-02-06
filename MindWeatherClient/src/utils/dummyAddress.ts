import { RegionCoordinates } from '../components/KoreaMap';

interface DummyAddress {
    fullAddress: string;
    region: string; // Level 1 (e.g. 서울)
    district: string; // Level 2 (e.g. 강남구)
    neighborhood: string; // Level 3 (e.g. 역삼동)
    coordinates: [number, number]; // Base coordinates of the region
}

// Map regions to list of real districts (Korean)
const DISTRICT_MAP: Record<string, string[]> = {
    '서울': ['강남구', '서초구', '송파구', '종로구', '마포구', '용산구', '성동구', '영등포구', '서대문구', '광진구'],
    '부산': ['해운대구', '수영구', '부산진구', '동래구', '사하구', '남구', '연제구', '금정구'],
    '대구': ['수성구', '달서구', '중구', '동구', '서구', '북구', '남구'],
    '인천': ['연수구', '남동구', '부평구', '계양구', '서구', '미추홀구', '중구'],
    '광주': ['서구', '북구', '광산구', '동구', '남구'],
    '대전': ['유성구', '서구', '중구', '동구', '대덕구'],
    '울산': ['남구', '중구', '울주군', '북구', '동구'],
    '세종': ['세종시'], // Sejong is special
    '경기': ['수원시', '성남시', '용인시', '고양시', '부천시', '화성시', '안산시', '안양시', '평택시'],
    '강원': ['춘천시', '원주시', '강릉시', '속초시', '동해시'],
    '충북': ['청주시', '충주시', '제천시'],
    '충남': ['천안시', '아산시', '공주시', '서산시'],
    '전북': ['전주시', '익산시', '군산시', '남원시'],
    '전남': ['여수시', '순천시', '목포시', '광양시'],
    '경북': ['포항시', '구미시', '경주시', '경산시', '안동시'],
    '경남': ['창원시', '김해시', '진주시', '양산시', '거제시'],
    '제주': ['제주시', '서귀포시']
};

const RANDOM_NEIGHBORHOODS = [
    '중앙동', '행복동', '사랑동', '희망동', '평화동',
    '1동', '2동', '3동', '본동', '신촌동',
    '역삼동', '청담동', '삼성동', '대치동', // Gangnam distinctive
    '한남동', '이태원동', // Yongsan
    '혜화동', '명동' // Jongno/Jung
];

export function generateRandomAddress(): DummyAddress {
    // 1. Pick a random region key
    const regionKeys = Object.keys(RegionCoordinates);
    const region = regionKeys[Math.floor(Math.random() * regionKeys.length)];

    // 2. Pick a random district for that region
    const districts = DISTRICT_MAP[region] || ['시청로']; // Fallback
    const district = districts[Math.floor(Math.random() * districts.length)];

    // 3. Pick a random neighborhood
    const neighborhood = RANDOM_NEIGHBORHOODS[Math.floor(Math.random() * RANDOM_NEIGHBORHOODS.length)];

    // 4. Construct Full Address
    // Format: "Region District Neighborhood" (e.g. "서울 강남구 역삼동")
    // MapView uses space splitting to parse levels.
    const fullAddress = `${region} ${district} ${neighborhood}`;

    return {
        fullAddress,
        region,
        district,
        neighborhood,
        coordinates: RegionCoordinates[region] || [127, 36]
    };
}
