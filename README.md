# namumark-clone

나무위키 엔진인 the seed의 파서 부분만 구현중입니다.

# 구조
```typescript
import { NamuMark } from "./namumark";

const mark = new NamuMark("== 문법 ==")
const parsedText = mark.parse()
```

 * NamuMark 생성자 호출
 * 생성자.parse() -> 문자 하나하나를 for loop문으로 namumark에 대응시킴


# TODO
 * ListParser의 2단계 -> 1단계 수정하기
 * TableParser 예정
 * TextParser 예정

# Typescript 컴파일링
 * tsc -w -> 컴파일 시 out 디렉토리가 생성됨
 * node out/main -> 컴파일 후 생성된 out/main.js를 실행
 * view.html에 파싱 결과가 표시
 