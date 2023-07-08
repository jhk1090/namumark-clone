# namumark-clone

나무위키 엔진인 the seed의 파서 부분만 구현중입니다.

# 구조
```typescript
// main.ts
import { NamuMark } from "./namumark";

const mark = new NamuMark("== 문법 ==")
const parsedText = mark.parse()
```

 * NamuMark 생성자 호출
 * 생성자.parse() -> 문자 하나하나를 for loop문으로 namumark에 대응시킴

# TODO
 * 리팩토링 중 - bracket 기능 완성하기 (#!shebang, 글자 크기, syntax highlighting)
 * tableProcessor, tableParser 제작하기
 * tocProcessor 제작하기
 * listProcessor, listParser 제작하기

# Typescript 컴파일링
```bash
$ npm run compile # typescript 컴파일 후 out 디렉토리가 생성됨
$ npm run output # 컴파일 후 생성된 out/main.js를 실행
```

 * view.html에 파싱 결과가 표시
 