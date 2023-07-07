import { NamuMark } from "./namumark";
import { writeFileSync } from "node:fs";

const text = "== 개요 ==\n== 시스템 요구 사항 ==\n== 에디션 목록 ==\n=== Android 에디션 ===\n=== iOS 에디션 ===\n=== Windows 에디션 ===\n=== Nintendo Switch 에디션 ===\n=== Xbox One 에디션 ===\n=== PS4 에디션 ===\n== 업데이트 내역 ==\n== 자바 에디션과 다른 점 ==\n=== 악성 플레이어의 이용 정지 ===\n=== 플랫폼 통합 ===\n=== Super Duper Graphics Pack (개발 취소) ===\n=== RTX 레이트레이싱 셰이더 지원 ===\n==== 9세대 콘솔 지원 여부 ====\n== 버그 ==\n== 멀티플레이 =="
const mark = new NamuMark(text, {theme: "LIGHT", title: "테스트"})
const parsedText = mark.parse()

writeFileSync("./view.html", parsedText)	
