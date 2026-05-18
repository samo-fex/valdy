
import { useState, useCallback, useRef } from 'react';
import { lazy as dynamic } from 'react';
// TODO: Fix signature if it was dynamic(() => import(...)) to just lazy(() => import(...))
import { Download, Loader2 } from 'lucide-react';

const ChartRenderer = dynamic(() => import('./ChartRenderer'));

interface ChartData {
  market_breakdown: Array<{ name: string; value: number; color: string }>;
  revenue_projections: Array<{ year: string; revenue: number; costs: number }>;
  financial_table: Array<{ metric: string; value: string }>;
}

interface PDFDownloadButtonProps {
  businessPlan: {
    executive_summary: string;
    market_and_sales: string;
    team_and_operations: string;
    financial_plan: string;
  };
  chartData?: ChartData;
  ideaName: string;
}

/**
 * PDF download button with chart rendering pipeline.
 * Uses useRef guard to prevent duplicate generation during async operations.
 */
export default function PDFDownloadButton({ businessPlan, chartData, ideaName }: PDFDownloadButtonProps) {
  const [isPreparingCharts, setIsPreparingCharts] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const generatingRef = useRef(false);

  const generateAndDownload = useCallback(async (images: { pieChart: string; barChart: string } | null) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsPreparingCharts(false);
    setIsGeneratingPDF(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: BusinessPlanPDF } = await import('./BusinessPlanPDF');

      const doc = (
        <BusinessPlanPDF
          ideaName={ideaName}
          executiveSummary={businessPlan.executive_summary}
          marketAndSales={businessPlan.market_and_sales}
          teamAndOperations={businessPlan.team_and_operations}
          financialPlan={businessPlan.financial_plan}
          chartData={chartData}
          pieChartImage={images?.pieChart}
          barChartImage={images?.barChart}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-plan-${ideaName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setIsGeneratingPDF(false);
      generatingRef.current = false;
    }
  }, [businessPlan, chartData, ideaName]);

  const handleClick = useCallback(() => {
    if (!chartData) {
      generateAndDownload(null);
      return;
    }
    setIsPreparingCharts(true);
  }, [chartData, generateAndDownload]);

  const onChartsComplete = useCallback((images: { pieChart: string; barChart: string }) => {
    generateAndDownload(images);
  }, [generateAndDownload]);

  const isLoading = isPreparingCharts || isGeneratingPDF;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-6 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
          isLoading
            ? 'bg-white/10 border border-white/20 opacity-60 cursor-not-allowed'
            : 'bg-white/10 border border-white/20 hover:bg-white/20'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {isPreparingCharts ? 'Preparing Charts...' : 'Generating PDF...'}
          </>
        ) : (
          <>
            <Download size={18} />
            Download PDF
          </>
        )}
      </button>
      {isPreparingCharts && chartData && (
        <ChartRenderer chartData={chartData} onChartsReady={onChartsComplete} />
      )}
    </>
  );
}
