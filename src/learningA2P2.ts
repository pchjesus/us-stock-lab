import type {LearningUnit} from './learningFoundation';

const orders={label:'SEC Investor.gov · 주문 유형',url:'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders'};
const execution={label:'SEC Investor.gov · 주문 체결',url:'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order'};
const nyse={label:'NYSE · 거래 시간',url:'https://www.nyse.com/trade/trading-information'};
const fed={label:'Federal Reserve · 정책금리',url:'https://www.federalreserve.gov/economy-at-a-glance-policy-rate.htm'};
const blsCpi={label:'BLS · CPI 질문과 답변',url:'https://www.bls.gov/cpi/questions-and-answers.htm'};
const beaPce={label:'BEA · PCE 물가지수',url:'https://www.bea.gov/data/personal-consumption-expenditures-price-index'};
const beaDifference={label:'BEA · CPI와 PCE의 차이',url:'https://www.bea.gov/help/faq/555'};
const blsJobs={label:'BLS · 고용 보고서',url:'https://www.bls.gov/news.release/empsit.nr0.htm'};

/** Educational examples only; they do not provide live quotes or place orders. */
export const p2Units:Record<'us-market'|'rates'|'macro',LearningUnit>={
 'us-market':{
  concept:'주식시장은 투자자가 주식을 사고파는 장소와 거래 과정을 뜻합니다. 거래소는 주문이 만나는 시장 중 하나입니다. 매수자는 사려 하고 매도자는 팔려 하며, 가격과 수량이 맞으면 거래가 체결됩니다.',
  importance:'최근 체결가는 직전에 실제 성사된 가격입니다. 매수호가(Bid)는 사려는 가격, 매도호가(Ask)는 팔려는 가격이며 그 차이가 스프레드입니다. 호가는 수량이 제한되고 바뀔 수 있으므로 다음 체결가가 최근 체결가와 같다는 보장은 없습니다.',
  application:'가격은 매수·매도의 수요와 공급, 기업 실적 및 이미 가격에 반영된 시장 기대 등에 영향을 받습니다. 시장가 주문은 가능한 가격으로 빠른 체결을 지향하지만 가격은 보장하지 않습니다. 지정가 매수는 지정가 이하에서만 체결되므로 가격 한도는 정해도 체결이 보장되지 않습니다. 유동성이 낮거나 거래가 중단되면 체결이 어렵거나 가격 차이가 커질 수 있습니다.',
  example:'아래는 모두 가상 호가입니다. 최근 체결가 $100.00을 보고 10주를 매수해도 $1,000.00으로 체결된다는 뜻이 아닙니다. 매도호가 $100.10에 10주가 모두 그대로 있다면 가상 금액은 $1,001.00이고 스프레드는 $0.20입니다. 수수료·세금은 제외하며 호가 변화나 수량 부족 시 실제 체결가는 달라질 수 있습니다.',
  table:{caption:'가상 호가와 최근 체결가 — 실제 시세 아님',headers:['구분','가격','의미'],rows:[['최근 체결가','$100.00','이전 거래 가격'],['매수호가 Bid','$99.90','사려는 가격'],['매도호가 Ask','$100.10','팔려는 가격'],['스프레드','$0.20','매도호가 − 매수호가']]},
  misunderstanding:'미국 정규장은 통상 동부시간 평일 09:30~16:00이며 휴장·조기 폐장 예외가 있습니다. 한국시간으로 서머타임에는 22:30~다음 날 05:00, 표준시에는 23:30~다음 날 06:00입니다. 프리마켓과 애프터마켓은 정규장 전후 거래이나 거래소·증권사별 시간이 다르고 유동성이 낮을 수 있습니다. 앱의 가상 주문은 정규장 제한과 합성 가격을 사용하는 시장가 방식이며 지정가·시간외 거래는 제공하지 않습니다. 합성 가격은 실제 시세나 실제 체결가가 아닙니다.',
  practice:{text:'시장 목록에서 교육용 합성 가격 표시를 관찰하고 차트 실습실에서 가격 변화를 살펴보세요. 실제 호가가 아니며 주문은 필요하지 않습니다.',href:'#market',label:'시장 목록 관찰하기 →'},
  questions:[{question:'가상 최근 체결가가 $100이어도 다음 시장가 매수 체결가가 달라질 수 있는 이유는?',options:[{text:'호가와 수량이 주문 도착 전에 변할 수 있기 때문',correct:true,feedback:'최근 체결가는 과거 거래이며 매도호가와 수량은 달라질 수 있습니다.'},{text:'최근 체결가가 모든 다음 거래 가격을 보장하기 때문',correct:false,feedback:'최근 체결가는 다음 거래의 가격을 보장하지 않습니다.'}]},{question:'가상 10주를 모두 $100.10에 사면 세금과 수수료를 제외한 금액은?',options:[{text:'$1,001.00',correct:true,feedback:'10 × $100.10 = $1,001.00입니다. 호가와 수량이 유지된다는 가정입니다.'},{text:'$1,000.00으로 항상 체결됩니다',correct:false,feedback:'그 금액은 최근 체결가 $100을 그대로 적용한 값이며 다음 체결가를 보장하지 않습니다.'}]},{question:'지정가 매수에 대한 설명은?',options:[{text:'가격 상한은 정하지만 체결은 보장되지 않습니다',correct:true,feedback:'지정가 이하의 거래 기회가 없으면 체결되지 않을 수 있습니다.'},{text:'언제나 즉시 체결되고 가격도 보장됩니다',correct:false,feedback:'지정가 조건이 충족되지 않거나 수량이 없으면 체결되지 않을 수 있습니다.'}]}],sources:[orders,execution,nyse]},
 rates:{
  concept:'금리는 일정 기간 돈을 빌리거나 맡길 때 적용되는 비율입니다. 미국 연방공개시장위원회(FOMC)는 은행 간 초단기 자금 거래에 쓰이는 연방기금금리의 목표범위를 정합니다. 시장금리는 채권이나 대출 시장에서 거래 조건과 위험 등에 따라 달라지는 금리입니다.',
  importance:'정책금리와 시장금리는 연결될 수 있지만 같은 숫자가 아니며 모든 대출금리가 같은 폭으로 즉시 바뀌지는 않습니다. 기존 고정금리 계약과 새 변동금리 대출의 영향도 다릅니다.',
  application:'시장이 이미 예상한 결정과 실제 발표의 차이, 향후 정책 전망과 경제 상황을 함께 살펴보세요. 금리가 올라가도 주가가 반드시 떨어지는 것은 아니고, 내려가도 반드시 오르는 것은 아닙니다.',
  example:'가상 사례: 새로 빌린 변동금리 차입금 $1,000,000에 연 4%를 1년간 적용하면 단순 이자 $40,000입니다. 같은 잔액에 연 5%가 온전히 1년 적용된다면 $50,000으로 $10,000 증가합니다. 수수료·상환·복리는 제외하며 정책금리 변동이 대출금리에 그대로 적용된다는 가정이 아닙니다.',
  timeline:{caption:'금리 변화가 영향을 줄 수 있는 경로 — 확정적 예측 아님',steps:[{title:'정책과 시장의 기대',text:'FOMC 목표범위와 향후 전망이 시장금리 기대에 영향을 줄 수 있습니다.'},{title:'차입비용과 채권수익률',text:'대출 조건과 채권수익률은 신용위험·기간·시장 여건에 따라 다르게 움직일 수 있습니다.'},{title:'현재 가치와 주식 평가',text:'미래 현금흐름을 할인율로 현재 가치로 환산할 때 다른 조건이 같으면 할인율이 높을수록 현재 가치는 낮아집니다. 실제 주가는 이익 전망 등에도 달려 있습니다.'}]},
  misunderstanding:'할인율에는 금리 외에도 위험과 기간이 반영될 수 있습니다. 성장주의 먼 미래 현금흐름이나 배당주의 현금배당을 해석할 때도 기업별 전망·재무구조·기대가 다릅니다. 금리만으로 업종이나 개별 주가의 방향을 단정할 수 없습니다. 앱의 FOMC 일정은 합성 예시이며 공식 발표 일정이 아닙니다.',
  practice:{text:'캘린더에서 FOMC 항목의 합성 자료 표시와 공식 출처를 확인하세요. 일정·가격을 실제 예측으로 사용하지 않습니다.',href:'#calendar',label:'경제 캘린더 살펴보기 →'},
  questions:[{question:'가상 차입금 $1,000,000에 연 4%가 1년 적용될 때 단순 이자는?',options:[{text:'$40,000',correct:true,feedback:'$1,000,000 × 0.04 = $40,000이며 비용·상환·복리는 제외합니다.'},{text:'$4,000',correct:false,feedback:'4%는 0.04이므로 단순 이자는 $40,000입니다.'}]},{question:'FOMC가 목표금리를 올리면 모든 주식은 반드시 하락하나요?',options:[{text:'아니요. 기대와 기업 전망 등 여러 요인이 작용합니다',correct:true,feedback:'시장에 이미 반영된 예상과 향후 이익 전망 등에 따라 반응은 달라질 수 있습니다.'},{text:'네. 모든 기업의 대출금리와 주가는 즉시 같은 폭으로 움직입니다',correct:false,feedback:'대출 계약과 시장 조건은 다르고 주가 방향도 확정되지 않습니다.'}]}],sources:[fed]},
 macro:{
  concept:'CPI는 미국 도시 소비자가 구입하는 소비재·서비스의 가격 변화를 측정합니다. PCE 물가지수는 소비자가 직접 지출하거나 대신 지급된 넓은 범위의 소비를 다룹니다. 두 지수는 대상 범위·가중치·계산 방식이 달라 같은 기간에도 값이 다를 수 있습니다.',
  importance:'Headline은 전체 항목을 포함한 물가입니다. Core는 보통 변동성이 큰 식품과 에너지를 제외해 기조를 살피지만 실제 생활비 전체를 뜻하지는 않습니다. 전월 대비(MoM)는 바로 전 달과, 전년 대비(YoY)는 지난해 같은 달과 비교하므로 기간과 단위를 같이 확인해야 합니다.',
  application:'비농업고용(NFP)은 사업체조사로 추정한 비농업 부문 일자리 수의 변화입니다. 실업률은 가계조사에서 경제활동인구 중 일자리가 없고 구직 중인 사람의 비율입니다. 조사 대상과 측정 개념이 다르므로 두 지표가 서로 다르게 움직일 수 있습니다.',
  example:'모두 가상 사례: 같은 가상 5월 CPI 전년 대비 상승률의 예상은 3.0%, 발표는 3.2%, 이전 4월 발표는 3.1%입니다. 발표는 예상보다 0.2%포인트 높지만, 이전 수치는 다른 달입니다. 예측과 결과의 차이가 주가 방향을 보장하지 않으며 이후 수정될 수 있습니다.',
  table:{caption:'물가·고용 지표 비교 — 발표기관과 측정 대상',headers:['지표','무엇을 측정하나요?','확인할 점'],rows:[['CPI · BLS','도시 소비자 물가','전체/Core, 전월·전년 대비'],['PCE · BEA','직접·대신 지급된 소비 물가','범위·가중치·기준 기간'],['비농업고용 · BLS','사업체조사 일자리 수 변화','단위와 이전 수치 수정'],['실업률 · BLS','가계조사 경제활동인구 중 실업 비율','고용자 수와 조사 대상 차이']]},
  misunderstanding:'예상은 발표 전 추정, 실제는 발표된 통계, 이전은 앞선 기간의 발표값입니다. 추가 자료와 계절 패턴 조정으로 이전 값이 수정될 수 있습니다. 계절조정은 반복적인 계절 영향을 통계적으로 제거하는 과정이지 불확실성을 없애는 것이 아닙니다. 시장은 예상, 수정치, 다른 지표와 정책 전망도 함께 반영하므로 발표와 주가가 정해진 방향으로 움직이지 않습니다. 앱 경제 일정은 합성 자료이며 실제·예상·이전 값이 없을 수 있습니다. 시간이 지났다는 이유로 실제 발표값이 생기지 않습니다.',
  practice:{text:'경제 캘린더에서 합성 자료 표시와 실제·예상·이전 값의 미제공 상태를 구분하고 공식 출처를 확인하세요.',href:'#calendar',label:'경제 일정 관찰하기 →'},
  questions:[{question:'같은 가상 5월 CPI 전년 대비 예상 3.0%, 발표 3.2%라면 차이는?',options:[{text:'발표가 예상보다 0.2%포인트 높습니다',correct:true,feedback:'3.2% − 3.0% = 0.2%포인트입니다. 주가 반응은 보장되지 않습니다.'},{text:'발표가 예상보다 0.2%포인트 낮습니다',correct:false,feedback:'3.2%는 3.0%보다 0.2%포인트 높습니다.'}]},{question:'비농업고용과 실업률이 서로 다르게 움직일 수 있는 이유는?',options:[{text:'사업체조사와 가계조사의 대상과 측정 개념이 다릅니다',correct:true,feedback:'일자리 수와 경제활동인구 중 실업자의 비율은 서로 다른 통계입니다.'},{text:'두 지표는 같은 수치를 다른 이름으로 표시합니다',correct:false,feedback:'조사 대상과 측정하는 내용이 다르므로 일치할 필요가 없습니다.'}]},{question:'앱의 합성 일정에서 발표 시각이 지났지만 실제 값이 없다면?',options:[{text:'값이 미제공 상태임을 확인합니다',correct:true,feedback:'시간 경과만으로 실제 발표값을 만들거나 확인했다고 가정하지 않습니다.'},{text:'시간이 지났으므로 예상값을 실제값으로 간주합니다',correct:false,feedback:'예상과 실제는 다른 값이며 미제공은 그대로 유지해야 합니다.'}]}],sources:[blsCpi,beaPce,beaDifference,blsJobs]}
};
