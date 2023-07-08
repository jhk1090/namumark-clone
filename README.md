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
 * TextTag는 일반 텍스트용. TextTag는 content와 escape를 받음. content = 내용, escape = 이스케이프 여부
 * HolderTag는 태그 시작 자리를 표시한다. HolderTag는 holderEnum과 alt와 property를 받음. holderEnum = 시작 자리 유형, alt = 원래 텍스트 내용, property = html 속성값.
 * RegularTag는 시작 태그와 끝 태그가 있는 HTML 태그이다. RegularTag는 tagEnum과 children, property를 받음. tagEnum = HTML 태그 유형, children = 자식들, property = html 속성값.
 * SingularTag는 끝 태그 없는 HTML 태그이다. SingularTag는 tagEnum과 property를 받음. tagEnum = HTML 태그 유형, property = html 속성값.

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
 