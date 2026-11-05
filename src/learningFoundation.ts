/** Educational explanations are separate from the frozen ten-lesson source. */
export interface LearningQuestion {question:string; options:{text:string;correct:boolean;feedback:string}[]}
export interface LearningUnit {concept:string;importance:string;application:string;example:string;misunderstanding:string;practice:{text:string;href:string;label:string};questions:LearningQuestion[];sources:{label:string;url:string}[]}
export const learningPath=[
 {title:'주식과 ETF',goal:'무엇을 소유하는지 구분해요.',topics:'기업 지분 · 펀드 · 분산',feature:'시장과 ETF 상세'},
 {title:'시장과 거래',goal:'가격과 거래 과정의 의미를 알아요.',topics:'거래시간 · 주문 · 환율',feature:'시장과 모의 주문'},
 {title:'기업과 재무',goal:'기업의 사업과 공식 자료를 읽어요.',topics:'매출 · 이익 · 재무제표',feature:'기업 재무와 근거 탭'},
 {title:'차트',goal:'합성 가격의 움직임을 관찰해요.',topics:'기간 · 캔들 · 이동평균',feature:'차트 실습실'},
 {title:'위험관리',goal:'손실과 분산의 한계를 이해해요.',topics:'변동성 · 자산배분 · 비용',feature:'포트폴리오와 관심종목'},
 {title:'종합 실습',goal:'자료를 확인하고 연습 과정을 되돌아봐요.',topics:'시나리오 · 근거 · 판단',feature:'합성 모의투자와 학습 화면'}
] as const;
const secIntro={label:'SEC Investor.gov · 투자 입문',url:'https://www.investor.gov/introduction-investing'};
const secEtf={label:'SEC Investor.gov · ETF 안내',url:'https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2'};
const secDiversify={label:'SEC Investor.gov · 자산배분과 분산',url:'https://www.investor.gov/introduction-investing/getting-started/asset-allocation'};
export const learningUnits:Record<'stock'|'etf',LearningUnit>={
 stock:{concept:'주식 한 주는 기업의 소유 지분을 나타냅니다. 주주는 기업 전체가 아니라 보유한 주식에 해당하는 지분을 갖습니다.',importance:'개별 회사의 사업과 시장의 기대가 모두 가격에 영향을 줄 수 있습니다. 주가 상승이 보장되지 않으며 회사가 어려워지면 투자금의 일부 또는 전부를 잃을 수 있습니다.',application:'기업 상세에서 사업 설명과 공식 재무 자료의 기간·출처를 살펴보세요. 자료의 과거 실적은 미래 주가를 확정하지 않습니다.',example:'가상 예시: 한 주를 $100에 사서 $120에 판다면 가격 차이는 주당 $20입니다. $80에 판다면 주당 $20 손실입니다. 이 예시는 수수료·세금·배당을 제외합니다.',misunderstanding:'주식 한 주가 회사 운영을 직접 마음대로 결정할 권리를 뜻하지는 않습니다. 의결권과 배당은 주식 종류와 회사의 결정에 따라 다릅니다. 주가가 낮다는 사실만으로 저평가라고 판단할 수 없습니다.',practice:{text:'시장에서 기업을 열어 사업 요약과 재무 탭을 확인하세요. 차트 실습실의 가격은 합성 예시입니다.',href:'#stock/AAPL',label:'애플 기업 정보 살펴보기 →'},questions:[
 {question:'가상 주식 한 주를 $100에 사서 $80에 팔면, 비용을 제외한 가격 차이는?',options:[{text:'$20 손실',correct:true,feedback:'매도 가격 $80에서 매수 가격 $100을 빼면 주당 −$20입니다.'},{text:'$20 이익',correct:false,feedback:'$80은 $100보다 낮습니다. 비용 제외 가격 차이는 −$20입니다.'}]},
 {question:'기업의 과거 실적이 좋으면 앞으로 주가가 반드시 오를까요?',options:[{text:'반드시 오릅니다',correct:false,feedback:'미래 기대와 시장 상황도 영향을 미치므로 과거 실적만으로 가격을 확정할 수 없습니다.'},{text:'보장되지 않습니다',correct:true,feedback:'과거 자료는 판단에 도움이 되지만 미래 가격이나 수익을 보장하지 않습니다.'}]}],sources:[secIntro]},
 etf:{concept:'ETF는 투자자의 돈을 모아 주식·채권 등 자산에 투자하는 펀드의 지분을 거래소에서 사고팔 수 있도록 만든 상품입니다. 무엇을 담는지는 펀드마다 다릅니다.',importance:'여러 자산에 노출될 수 있지만 특정 업종이나 소수 자산에 집중하는 ETF도 있습니다. 분산은 개별 위험을 줄이는 데 도움을 줄 수 있어도 시장 전체의 하락이나 손실을 없애지는 못합니다.',application:'ETF 상세의 전략과 공식 발행사 자료를 확인하세요. 이 앱에서 미확인인 구성·보수·분배금은 발행사의 최신 자료를 직접 확인해야 합니다.',example:'가상 예시: $100을 한 기업 주식 하나에 투자하면 그 기업에 집중됩니다. 여러 기업을 담은 ETF 한 주에 $100을 투자해도 그 펀드의 구성과 비중에 따라 손실을 볼 수 있습니다. 실제 ETF 구성이나 수익률을 뜻하지 않습니다.',misunderstanding:'모든 ETF가 같은 지수를 추종하거나 넓게 분산되는 것은 아닙니다. 운용 비용은 펀드 자산에서 차감되며 거래 비용도 생길 수 있습니다. 거래소 가격은 펀드의 순자산가치(NAV)와 다를 수 있습니다.',practice:{text:'VOO 상품정보에서 확인된 설명과 미확인 항목을 구분하고 공식 링크를 찾아보세요. 거래를 실행할 필요는 없습니다.',href:'#stock/VOO',label:'VOO 상품정보 살펴보기 →'},questions:[
 {question:'ETF를 사면 모든 시장 하락을 피할 수 있나요?',options:[{text:'네, 손실이 사라집니다',correct:false,feedback:'분산은 일부 위험을 줄일 수 있지만 시장 전체 하락과 손실을 막아주지는 않습니다.'},{text:'아니요, 손실 가능성이 남습니다',correct:true,feedback:'ETF의 구성 자산과 시장이 하락하면 ETF 가치도 하락할 수 있습니다.'}]},
 {question:'ETF 비용에 대한 설명으로 적절한 것은?',options:[{text:'운용 비용이 수익에 영향을 줄 수 있습니다',correct:true,feedback:'펀드 비용은 자산에서 차감되며 장기간에는 작은 차이도 누적될 수 있습니다.'},{text:'거래소에서 거래하면 운용 비용이 없습니다',correct:false,feedback:'거래소에서 매매해도 펀드의 운용 비용과 별도의 거래 비용이 있을 수 있습니다.'}]},
 {question:'모든 ETF가 넓게 분산되어 있을까요?',options:[{text:'아니요, 좁은 업종에 집중할 수 있습니다',correct:true,feedback:'목적과 구성 종목을 확인해야 하며, 이름만으로 분산 정도를 판단할 수 없습니다.'},{text:'네, ETF라면 모두 같습니다',correct:false,feedback:'ETF는 투자 대상과 집중도가 다르므로 구성과 위험을 확인해야 합니다.'}]}],sources:[secEtf,secDiversify]}
};
