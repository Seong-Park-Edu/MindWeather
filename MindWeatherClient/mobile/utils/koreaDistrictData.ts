// Korean Administrative Districts (시/도 → 시/군/구 → 읍/면/동)
// This provides detailed location data for dummy data generation

export interface DistrictData {
    province: string;        // 시/도
    city: string;           // 시/군/구
    district: string;       // 읍/면/동
    fullAddress: string;    // 전체 주소
}

// Sample districts for each province (major areas)
const SEOUL_DISTRICTS = [
    { city: '강남구', districts: ['역삼동', '삼성동', '청담동', '논현동', '압구정동', '신사동', '대치동', '개포동', '일원동', '수서동'] },
    { city: '서초구', districts: ['서초동', '방배동', '잠원동', '반포동', '양재동', '내곡동'] },
    { city: '송파구', districts: ['잠실동', '신천동', '가락동', '문정동', '장지동', '풍납동', '방이동'] },
    { city: '강동구', districts: ['천호동', '성내동', '길동', '둔촌동', '암사동', '명일동', '고덕동'] },
    { city: '마포구', districts: ['합정동', '상수동', '서교동', '연남동', '망원동', '공덕동', '아현동'] },
    { city: '용산구', districts: ['이태원동', '한남동', '용산동', '청파동', '원효로동', '효창동'] },
    { city: '종로구', districts: ['종로1가', '종로2가', '삼청동', '가회동', '북촌', '인사동', '광화문'] },
    { city: '중구', districts: ['명동', '을지로동', '충무로', '남대문로', '회현동', '소공동'] },
    { city: '영등포구', districts: ['여의도동', '영등포동', '당산동', '문래동', '양평동', '신길동'] },
    { city: '강서구', districts: ['화곡동', '등촌동', '가양동', '마곡동', '공항동', '방화동'] },
    { city: '관악구', districts: ['신림동', '봉천동', '남현동', '낙성대동'] },
    { city: '동작구', districts: ['사당동', '노량진동', '상도동', '흑석동', '대방동'] },
    { city: '성북구', districts: ['성북동', '정릉동', '길음동', '돈암동', '안암동', '보문동'] },
    { city: '노원구', districts: ['상계동', '중계동', '하계동', '공릉동', '월계동'] },
    { city: '은평구', districts: ['불광동', '연신내', '응암동', '역촌동', '녹번동', '수색동'] },
];

const BUSAN_DISTRICTS = [
    { city: '해운대구', districts: ['해운대동', '좌동', '우동', '중동', '송정동', '재송동'] },
    { city: '부산진구', districts: ['서면', '부전동', '전포동', '연지동', '범천동', '양정동'] },
    { city: '남구', districts: ['대연동', '용호동', '문현동', '용당동', '감만동'] },
    { city: '동래구', districts: ['온천동', '명륜동', '사직동', '복천동', '안락동'] },
    { city: '중구', districts: ['중앙동', '남포동', '광복동', '보수동', '대청동'] },
    { city: '사하구', districts: ['괴정동', '하단동', '다대동', '장림동', '신평동'] },
    { city: '금정구', districts: ['서동', '부곡동', '장전동', '금사동', '회동동'] },
    { city: '연제구', districts: ['연산동', '거제동', '연산제동'] },
    { city: '수영구', districts: ['광안동', '수영동', '민락동', '망미동'] },
    { city: '사상구', districts: ['주례동', '감전동', '학장동', '괘법동', '모라동'] },
];

const DAEGU_DISTRICTS = [
    { city: '중구', districts: ['동성로', '대봉동', '삼덕동', '남산동', '대신동'] },
    { city: '수성구', districts: ['수성동', '범어동', '만촌동', '황금동', '두산동'] },
    { city: '달서구', districts: ['월성동', '상인동', '성당동', '본리동', '송현동'] },
    { city: '동구', districts: ['신암동', '효목동', '동촌동', '불로동', '방촌동'] },
    { city: '북구', districts: ['칠성동', '침산동', '산격동', '복현동', '대현동'] },
];

const INCHEON_DISTRICTS = [
    { city: '연수구', districts: ['연수동', '송도동', '동춘동', '옥련동', '청학동'] },
    { city: '남동구', districts: ['간석동', '구월동', '논현동', '만수동', '서창동'] },
    { city: '부평구', districts: ['부평동', '산곡동', '삼산동', '십정동', '갈산동'] },
    { city: '계양구', districts: ['작전동', '계산동', '효성동', '임학동', '동양동'] },
    { city: '미추홀구', districts: ['주안동', '숭의동', '용현동', '학익동', '문학동'] },
    { city: '서구', districts: ['검단동', '청라동', '가정동', '원창동', '석남동'] },
    { city: '중구', districts: ['신포동', '북성동', '율목동', '연안동'] },
];

const GWANGJU_DISTRICTS = [
    { city: '서구', districts: ['치평동', '상무동', '풍암동', '화정동', '금호동'] },
    { city: '북구', districts: ['용봉동', '운암동', '문흥동', '중흥동', '두암동'] },
    { city: '남구', districts: ['봉선동', '주월동', '월산동', '백운동', '양림동'] },
    { city: '동구', districts: ['충장로', '금남로', '계림동', '산수동', '학동'] },
    { city: '광산구', districts: ['수완동', '월계동', '우산동', '첨단동', '신창동'] },
];

const DAEJEON_DISTRICTS = [
    { city: '유성구', districts: ['봉명동', '궁동', '지족동', '노은동', '도룡동'] },
    { city: '서구', districts: ['둔산동', '탄방동', '월평동', '갈마동', '도안동'] },
    { city: '중구', districts: ['대흥동', '은행동', '선화동', '문화동', '중촌동'] },
    { city: '동구', districts: ['홍도동', '판암동', '신흥동', '삼성동', '대동'] },
    { city: '대덕구', districts: ['신탄진동', '덕암동', '읍내동', '목상동', '비래동'] },
];

const ULSAN_DISTRICTS = [
    { city: '남구', districts: ['삼산동', '달동', '무거동', '신정동', '옥동'] },
    { city: '중구', districts: ['성남동', '복산동', '태화동', '학산동', '우정동'] },
    { city: '동구', districts: ['전하동', '일산동', '화정동', '방어동', '주전동'] },
    { city: '북구', districts: ['정자동', '명촌동', '호계동', '중산동', '염포동'] },
    { city: '울주군', districts: ['언양읍', '온양읍', '범서읍', '청량읍', '삼남읍'] },
];

const SEJONG_DISTRICTS = [
    { city: '세종시', districts: ['조치원읍', '도담동', '아름동', '종촌동', '새롬동', '어진동', '해밀동', '보람동', '대평동', '고운동'] },
];

const GYEONGGI_DISTRICTS = [
    { city: '수원시', districts: ['영통동', '광교동', '행궁동', '정자동', '매탄동', '권선동', '팔달동'] },
    { city: '성남시', districts: ['분당동', '정자동', '서현동', '판교동', '야탑동', '수진동', '단대동'] },
    { city: '고양시', districts: ['일산동', '백석동', '주엽동', '화정동', '대화동', '덕양동'] },
    { city: '용인시', districts: ['수지동', '죽전동', '기흥동', '동백동', '처인동', '양지동'] },
    { city: '화성시', districts: ['동탄동', '병점동', '봉담읍', '향남읍', '남양동', '태안읍'] },
    { city: '과천시', districts: ['중앙동', '별양동', '문원동', '갈현동', '과천동'] },
    { city: '안양시', districts: ['범계동', '평촌동', '비산동', '관양동', '안양동'] },
    { city: '부천시', districts: ['중동', '상동', '원미동', '소사동', '심곡동', '역곡동'] },
    { city: '광명시', districts: ['철산동', '하안동', '소하동', '광명동', '일직동'] },
    { city: '평택시', districts: ['평택동', '비전동', '서정동', '안중읍', '오성면', '포승읍'] },
    { city: '시흥시', districts: ['정왕동', '배곧동', '대야동', '신천동', '은행동'] },
    { city: '파주시', districts: ['금촌동', '운정동', '문산읍', '파주읍', '교하동'] },
    { city: '김포시', districts: ['사우동', '풍무동', '장기동', '고촌읍', '마산동'] },
    { city: '의정부시', districts: ['의정부동', '호원동', '민락동', '녹양동', '장암동'] },
    { city: '남양주시', districts: ['다산동', '별내동', '화도읍', '진접읍', '진건읍'] },
];

const GANGWON_DISTRICTS = [
    { city: '춘천시', districts: ['효자동', '석사동', '후평동', '퇴계동', '신북읍'] },
    { city: '원주시', districts: ['무실동', '단계동', '명륜동', '반곡동', '문막읍'] },
    { city: '강릉시', districts: ['포남동', '교동', '옥천동', '성산면', '주문진읍'] },
    { city: '속초시', districts: ['조양동', '교동', '영랑동', '청호동', '도문동'] },
    { city: '동해시', districts: ['천곡동', '부곡동', '발한동', '북평동', '묵호동'] },
    { city: '삼척시', districts: ['남양동', '교동', '성내동', '원덕읍', '도계읍'] },
    { city: '홍천군', districts: ['홍천읍', '화촌면', '두촌면', '내촌면', '서면'] },
    { city: '평창군', districts: ['평창읍', '진부면', '대관령면', '봉평면', '미탄면'] },
    { city: '정선군', districts: ['정선읍', '고한읍', '사북읍', '신동읍', '북평면'] },
    { city: '영월군', districts: ['영월읍', '상동읍', '김삿갓면', '북면', '하동면'] },
];

const CHUNGBUK_DISTRICTS = [
    { city: '청주시', districts: ['상당구', '서원구', '흥덕구', '청원구', '오창읍', '옥산면'] },
    { city: '충주시', districts: ['성내동', '교현동', '연수동', '칠금동', '목행동'] },
    { city: '제천시', districts: ['의림동', '청전동', '화산동', '봉양읍', '백운면'] },
    { city: '음성군', districts: ['음성읍', '금왕읍', '대소면', '삼성면', '원남면'] },
    { city: '진천군', districts: ['진천읍', '덕산읍', '초평면', '문백면', '백곡면'] },
];

const CHUNGNAM_DISTRICTS = [
    { city: '천안시', districts: ['신부동', '두정동', '불당동', '백석동', '성정동', '성환읍', '직산읍'] },
    { city: '아산시', districts: ['온천동', '모종동', '배방읍', '탕정면', '둔포면'] },
    { city: '서산시', districts: ['석림동', '동문동', '예천동', '해미면', '대산읍'] },
    { city: '당진시', districts: ['당진1동', '당진2동', '송악읍', '합덕읍', '신평면'] },
    { city: '논산시', districts: ['취암동', '화지동', '연산면', '강경읍', '은진면'] },
    { city: '공주시', districts: ['웅진동', '신관동', '금학동', '반포면', '유구읍'] },
];

const JEONBUK_DISTRICTS = [
    { city: '전주시', districts: ['완산구', '덕진구', '효자동', '인후동', '중앙동', '풍남동'] },
    { city: '익산시', districts: ['모현동', '남중동', '영등동', '마동', '부송동'] },
    { city: '군산시', districts: ['나운동', '수송동', '월명동', '조촌동', '옥구읍'] },
    { city: '정읍시', districts: ['시기동', '상동', '수성동', '신태인읍', '북면'] },
    { city: '남원시', districts: ['향교동', '도통동', '죽항동', '금지면', '산내면'] },
    { city: '김제시', districts: ['요촌동', '검산동', '황산면', '만경읍', '금산면'] },
];

const JEONNAM_DISTRICTS = [
    { city: '목포시', districts: ['무안동', '용당동', '옥암동', '하당동', '상동'] },
    { city: '여수시', districts: ['선원동', '충무동', '돌산읍', '소라면', '학동'] },
    { city: '순천시', districts: ['연향동', '조례동', '왕지동', '낙안면', '별량면'] },
    { city: '광양시', districts: ['광양읍', '중마동', '금호동', '진월면', '옥곡면'] },
    { city: '나주시', districts: ['금계동', '성북동', '빛가람동', '남평읍', '공산면'] },
    { city: '무안군', districts: ['무안읍', '삼향읍', '몽탄면', '청계면', '현경면'] },
];

const GYEONGBUK_DISTRICTS = [
    { city: '포항시', districts: ['북구', '남구', '죽도동', '두호동', '장량동', '연일읍'] },
    { city: '경주시', districts: ['동천동', '성건동', '황성동', '안강읍', '건천읍'] },
    { city: '구미시', districts: ['원평동', '형곡동', '인동동', '선산읍', '고아읍'] },
    { city: '김천시', districts: ['평화동', '자산동', '율곡동', '아포읍', '농소면'] },
    { city: '안동시', districts: ['옥동', '법흥동', '명륜동', '풍천면', '예안면'] },
    { city: '영주시', districts: ['영주동', '휴천동', '가흥동', '풍기읍', '순흥면'] },
    { city: '영천시', districts: ['완산동', '금호읍', '북안면', '자양면', '화북면'] },
    { city: '상주시', districts: ['성동동', '신봉동', '함창읍', '공검면', '낙동면'] },
];

const GYEONGNAM_DISTRICTS = [
    { city: '창원시', districts: ['의창구', '성산구', '마산합포구', '마산회원구', '진해구', '상남동', '용호동'] },
    { city: '김해시', districts: ['내외동', '부원동', '장유동', '진영읍', '주촌면'] },
    { city: '진주시', districts: ['상봉동', '칠암동', '평거동', '금곡면', '대평면'] },
    { city: '양산시', districts: ['삼호동', '물금읍', '웅상출장소', '동면', '하북면'] },
    { city: '거제시', districts: ['고현동', '옥포동', '아주동', '장평동', '연초면'] },
    { city: '통영시', districts: ['도산면', '북신동', '무전동', '산양읍', '광도면'] },
    { city: '사천시', districts: ['선구동', '동금동', '사남면', '정동면', '곤명면'] },
    { city: '밀양시', districts: ['가곡동', '내일동', '삼랑진읍', '하남읍', '산내면'] },
];

const JEJU_DISTRICTS = [
    { city: '제주시', districts: ['삼도동', '이도동', '연동', '노형동', '아라동', '조천읍', '구좌읍', '한림읍', '애월읍', '한경면', '우도면'] },
    { city: '서귀포시', districts: ['서귀동', '서홍동', '중문동', '대정읍', '남원읍', '표선면', '성산읍', '안덕면'] },
];

// Province to district data mapping
const PROVINCE_DISTRICTS: Record<string, { city: string; districts: string[] }[]> = {
    '서울': SEOUL_DISTRICTS,
    '부산': BUSAN_DISTRICTS,
    '대구': DAEGU_DISTRICTS,
    '인천': INCHEON_DISTRICTS,
    '광주': GWANGJU_DISTRICTS,
    '대전': DAEJEON_DISTRICTS,
    '울산': ULSAN_DISTRICTS,
    '세종': SEJONG_DISTRICTS,
    '경기': GYEONGGI_DISTRICTS,
    '강원': GANGWON_DISTRICTS,
    '충북': CHUNGBUK_DISTRICTS,
    '충남': CHUNGNAM_DISTRICTS,
    '전북': JEONBUK_DISTRICTS,
    '전남': JEONNAM_DISTRICTS,
    '경북': GYEONGBUK_DISTRICTS,
    '경남': GYEONGNAM_DISTRICTS,
    '제주': JEJU_DISTRICTS,
};

/**
 * Get all provinces (시/도)
 */
export function getAllProvinces(): string[] {
    return Object.keys(PROVINCE_DISTRICTS);
}

/**
 * Get a random detailed address (시/도 + 시/군/구 + 읍/면/동)
 */
export function getRandomDetailedAddress(): DistrictData {
    const provinces = getAllProvinces();
    const province = provinces[Math.floor(Math.random() * provinces.length)];

    const cities = PROVINCE_DISTRICTS[province];
    const cityData = cities[Math.floor(Math.random() * cities.length)];

    const district = cityData.districts[Math.floor(Math.random() * cityData.districts.length)];

    return {
        province,
        city: cityData.city,
        district,
        fullAddress: `${province} ${cityData.city} ${district}`,
    };
}

/**
 * Get multiple random detailed addresses
 */
export function getRandomDetailedAddresses(count: number): DistrictData[] {
    return Array.from({ length: count }, () => getRandomDetailedAddress());
}

/**
 * Get all districts for a specific province
 */
export function getDistrictsForProvince(province: string): DistrictData[] {
    const cities = PROVINCE_DISTRICTS[province];
    if (!cities) return [];

    const result: DistrictData[] = [];
    cities.forEach(cityData => {
        cityData.districts.forEach(district => {
            result.push({
                province,
                city: cityData.city,
                district,
                fullAddress: `${province} ${cityData.city} ${district}`,
            });
        });
    });

    return result;
}

/**
 * Get total count of all districts
 */
export function getTotalDistrictCount(): number {
    let count = 0;
    Object.values(PROVINCE_DISTRICTS).forEach(cities => {
        cities.forEach(cityData => {
            count += cityData.districts.length;
        });
    });
    return count;
}
