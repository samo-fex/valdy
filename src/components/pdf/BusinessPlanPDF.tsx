
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const EMERALD = {
  900: '#064e3b',
  800: '#065f46',
  700: '#047857',
  600: '#059669',
  500: '#10b981',
  400: '#34d399',
  300: '#6ee7b7',
  100: '#d1fae5',
  50: '#ecfdf5',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  coverPage: {
    padding: 0,
    fontFamily: 'Courier',
    backgroundColor: '#ffffff',
  },
  coverHeader: {
    backgroundColor: EMERALD[700],
    height: 280,
    padding: 50,
    justifyContent: 'flex-end',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Courier-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: EMERALD[300],
    marginBottom: 4,
  },
  coverDate: {
    fontSize: 11,
    color: EMERALD[300],
    marginTop: 12,
  },
  coverBody: {
    padding: 50,
    flexGrow: 1,
  },
  coverBrand: {
    fontSize: 10,
    color: EMERALD[600],
    marginTop: 20,
  },
  coverDivider: {
    height: 3,
    backgroundColor: EMERALD[500],
    marginVertical: 20,
    width: 80,
  },
  coverHighlight: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.6,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: EMERALD[500],
  },
  headerText: {
    fontSize: 8,
    color: EMERALD[700],
    fontFamily: 'Courier-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 7,
    color: EMERALD[600],
    fontFamily: 'Courier-Bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Courier-Bold',
    color: EMERALD[700],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: EMERALD[400],
    marginBottom: 14,
    width: 60,
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.7,
    color: '#374151',
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 10,
  },
  bulletDot: {
    fontSize: 10,
    color: EMERALD[500],
    marginRight: 8,
    fontFamily: 'Courier-Bold',
  },
  bulletText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    flex: 1,
  },
  boldText: {
    fontFamily: 'Courier-Bold',
    color: '#111827',
  },
  chartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  chartBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: EMERALD[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: EMERALD[100],
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: 'Courier-Bold',
    color: EMERALD[700],
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chartImage: {
    width: 220,
    height: 160,
  },
  table: {
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: EMERALD[700],
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Courier-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: EMERALD[50],
  },
  tableMetric: {
    flex: 2,
    fontSize: 9,
    color: '#374151',
  },
  tableValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Courier-Bold',
    color: EMERALD[700],
    textAlign: 'right',
  },
});

function parseTextSegments(text: string): Array<{ text: string; bold: boolean }> {
  const segments: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.substring(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), bold: false });
  }
  return segments;
}

function BulletLine({ text }: { text: string }) {
  const segments = parseTextSegments(text.replace(/^-\s*/, ''));
  return (
    <View style={styles.bulletPoint}>
      <Text style={styles.bulletDot}>{'\u2022'}</Text>
      <Text style={styles.bulletText}>
        {segments.map((seg, i) =>
          seg.bold
            ? <Text key={i} style={styles.boldText}>{seg.text}</Text>
            : <Text key={i}>{seg.text}</Text>
        )}
      </Text>
    </View>
  );
}

function SectionContent({ content }: { content: string }) {
  const lines = content.split('\n').filter(l => l.trim());
  return (
    <View>
      {lines.map((line, i) => {
        if (line.trim().startsWith('-')) {
          return <BulletLine key={i} text={line} />;
        }
        const segments = parseTextSegments(line);
        return (
          <Text key={i} style={styles.sectionContent}>
            {segments.map((seg, j) =>
              seg.bold
                ? <Text key={j} style={styles.boldText}>{seg.text}</Text>
                : <Text key={j}>{seg.text}</Text>
            )}
          </Text>
        );
      })}
    </View>
  );
}

interface ChartData {
  market_breakdown: Array<{ name: string; value: number; color: string }>;
  revenue_projections: Array<{ year: string; revenue: number; costs: number }>;
  financial_table: Array<{ metric: string; value: string }>;
}

interface BusinessPlanPDFProps {
  ideaName: string;
  executiveSummary: string;
  marketAndSales: string;
  teamAndOperations: string;
  financialPlan: string;
  chartData?: ChartData;
  pieChartImage?: string;
  barChartImage?: string;
}

/**
 * @react-pdf/renderer Document component for business plan PDF generation.
 * Includes cover page, 4 content sections, embedded chart images, and financial tables.
 */
export default function BusinessPlanPDF({
  ideaName,
  executiveSummary,
  marketAndSales,
  teamAndOperations,
  financialPlan,
  chartData,
  pieChartImage,
  barChartImage,
}: BusinessPlanPDFProps) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHeader}>
          <Text style={styles.coverSubtitle}>CURATOS DNA | Business Validation</Text>
          <Text style={styles.coverTitle}>Business Plan</Text>
          <Text style={styles.coverSubtitle}>{ideaName}</Text>
          <Text style={styles.coverDate}>{today}</Text>
        </View>
        <View style={styles.coverBody}>
          <View style={styles.coverDivider} />
          <Text style={styles.coverHighlight}>
            This business plan was generated using AI-powered validation across 7 key business pillars,
            with gap analysis and strategic improvements applied.
          </Text>
          <Text style={styles.coverHighlight}>
            Validated by valdy - the intelligent business idea validator.
          </Text>
          <Text style={styles.coverBrand}>Generated by valdy | curatos.io</Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>valdy - Business Plan</Text>
          <Text style={styles.headerText}>{ideaName}</Text>
        </View>
        <Text style={styles.sectionTitle}>1. Executive Summary</Text>
        <View style={styles.sectionDivider} />
        <SectionContent content={executiveSummary} />
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by valdy | {today}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Market and Sales + Charts */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>valdy - Business Plan</Text>
          <Text style={styles.headerText}>{ideaName}</Text>
        </View>
        <Text style={styles.sectionTitle}>2. Market and Sales Strategy</Text>
        <View style={styles.sectionDivider} />
        <SectionContent content={marketAndSales} />

        {(pieChartImage || barChartImage) && (
          <View style={styles.chartsContainer}>
            {pieChartImage && (
              <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>Market Breakdown</Text>
                <img style={styles.chartImage} src={pieChartImage} />
              </View>
            )}
            {barChartImage && (
              <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>Revenue Projections</Text>
                <img style={styles.chartImage} src={barChartImage} />
              </View>
            )}
          </View>
        )}

        {chartData?.financial_table && chartData.financial_table.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Key Metric</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Value</Text>
            </View>
            {chartData.financial_table.map((row, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableMetric}>{row.metric}</Text>
                <Text style={styles.tableValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by valdy | {today}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Team and Operations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>valdy - Business Plan</Text>
          <Text style={styles.headerText}>{ideaName}</Text>
        </View>
        <Text style={styles.sectionTitle}>3. Team and Operations</Text>
        <View style={styles.sectionDivider} />
        <SectionContent content={teamAndOperations} />
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by valdy | {today}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Financial Plan */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>valdy - Business Plan</Text>
          <Text style={styles.headerText}>{ideaName}</Text>
        </View>
        <Text style={styles.sectionTitle}>4. Financial Plan</Text>
        <View style={styles.sectionDivider} />
        <SectionContent content={financialPlan} />

        {chartData?.revenue_projections && chartData.revenue_projections.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Period</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Revenue ($M)</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Costs ($M)</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Profit ($M)</Text>
            </View>
            {chartData.revenue_projections.map((row, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableMetric, { flex: 1 }]}>{row.year}</Text>
                <Text style={[styles.tableValue, { flex: 1 }]}>${row.revenue}M</Text>
                <Text style={[styles.tableValue, { flex: 1, color: '#ef4444' }]}>${row.costs}M</Text>
                <Text style={[styles.tableValue, { flex: 1, color: row.revenue - row.costs > 0 ? EMERALD[600] : '#ef4444' }]}>
                  ${row.revenue - row.costs}M
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by valdy | {today}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
