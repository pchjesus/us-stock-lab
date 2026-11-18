import type {CompanySymbol} from '../../companyData';
import {snapshotMeta,validatedValuationSnapshot,valuationDisplay,valuationMetricDescriptions,type ValuationMetric} from '../../valuationSnapshots';

const fields=['per','pbr','roe'] as const;
export function ValuationComparison({symbol}:{symbol:CompanySymbol}){
 const snapshot=validatedValuationSnapshot(symbol);
 if(!snapshot)return <section className="panel v1-valuation" aria-label="PER PBR ROE 산업 참고 지표"><h2>기업 가치평가 · 업계 참고</h2><p>검증된 기업/산업 지표가 없어서 PER·PBR·ROE를 표시하지 않습니다. 합성 가격으로 계산하지 않아요.</p></section>;
 return <section className="panel v1-valuation" aria-labelledby="v1-valuation-title">
  <div className="v1-valuation-heading">
   <div><p className="eyebrow">FUNDAMENTALS · REFERENCE ONLY</p><h2 id="v1-valuation-title">기업 가치평가 · 업계 참고</h2><p>기업은 {snapshotMeta.companyDate} 기준 참고 자료, 산업군은 {snapshotMeta.industryDate} 자료입니다. <strong>시점·집계방법이 달라 직접적인 투자 판단에 사용하지 마세요.</strong></p></div>
   <span className="v1-valuation-status">실제 시장자료 스냅샷 · 주문 시세와 별개</span>
  </div>
  <div className="v1-valuation-grid">
   {fields.map(metric=>{
    const info=valuationMetricDescriptions[metric];
    const companyValue=snapshot.company[metric],sectorValue=snapshot.industry[metric];
    return <article key={metric} className="v1-valuation-card" data-testid={'valuation-'+metric}>
      <div className="v1-valuation-name"><strong>{info.label}</strong><span>{info.fullName}</span></div>
      <dl><div><dt>{symbol} · {snapshotMeta.companyDate}</dt><dd data-testid={'valuation-company-'+metric}>{valuationDisplay(metric,companyValue)}</dd></div><div><dt>유사 업종 · {snapshotMeta.industryDate}</dt><dd data-testid={'valuation-industry-'+metric}>{valuationDisplay(metric,sectorValue)}</dd></div></dl>
      <p>{info.description}</p>
    </article>;
   })}
  </div>
  <div className="v1-valuation-footnote">
   <p><strong>산업군 대응:</strong> {snapshot.industry.name} · 미국 기업 {snapshot.industry.firms}개. 사업이 여러 영역에 걸친 기업이 있어 <strong>정확히 동일한 경쟁사 집단이 아닌 교육용 유사 산업군</strong>입니다. 업계 수치는 기업별 데이터의 단순 평균과 다를 수 있습니다.</p>
   <p><strong>계산 기준:</strong> 기업 PER은 최근 12개월 수익 기준, PBR·ROE는 외부 제공자의 공시·시장 자료 집계값입니다. 업계 PER은 NYU Stern의 <em>Trailing PE</em>, PBR은 <em>PBV</em>, ROE는 비조정 <em>ROE</em>입니다. 서로 산식·자료 시점·분류가 다르므로 높고 낮음을 자동 평가하지 않습니다.</p>
   <p><strong>자료:</strong> <a href={snapshot.company.source} target="_blank" rel="noreferrer">기업 PER·PBR·ROE 원본 ↗<span className="sr-only"> (새 탭)</span></a> · <a href={snapshotMeta.industryPERSource} target="_blank" rel="noreferrer">업계 PER ↗</a> · <a href={snapshotMeta.industryPBRSource} target="_blank" rel="noreferrer">업계 PBR·ROE ↗</a>. 이 값들은 고정 스냅샷으로 자동 갱신되지 않으며 합성 주가·가상주문·계좌 손익 계산에 사용되지 않습니다.</p>
  </div>
 </section>;
}
