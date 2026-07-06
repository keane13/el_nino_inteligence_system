import { BigQuery } from '@google-cloud/bigquery';

let bqClient: BigQuery | null = null;

export function getBigQueryClient() {
  if (!bqClient) {
    const keyPath = 'C:/Users/keane/Desktop/Portofolio/Top 5/jakarta-pulse-v2/jakarta-pulse-v2/backend/data/smooth-reason-491707-f6-df06120b499a.json';
    bqClient = new BigQuery({
      projectId: 'smooth-reason-491707-f6',
      keyFilename: keyPath,
    });
  }
  return bqClient;
}

export async function fetchPredictionsFromBigQuery() {
  const bq = getBigQueryClient();
  
  // We'll aggregate data by province to create predictions for Fire and Drought
  const query = `
    SELECT 
      provinsi as district, 
      SUM(jumlah_kebakaran_hutan_dan_lahan) as total_fires,
      SUM(jumlah_kekeringan) as total_droughts,
      AVG(kualitas_udara_pm25_ugm3) as avg_pm25,
      MAX(status) as status
    FROM \`smooth-reason-491707-f6.el_nino.rekap_elnino_baru_2025_2026\`
    GROUP BY provinsi
  `;

  try {
    const [rows] = await bq.query(query);
    
    const predictions: any[] = [];
    
    rows.forEach(row => {
      // Map to Wildfire Prediction
      if (row.total_fires > 0) {
        predictions.push({
          district: row.district,
          category: "Wildfire Hotspot",
          predicted_complaints_7d: row.total_fires, // Simplified for testing
          confidence: 85,
          trend: row.total_fires > 10 ? "rising" : "stable",
          risk_score: Math.min(100, row.total_fires * 5),
          historical_avg: Math.round(row.total_fires / 4 * 10) / 10,
          history: Array.from({length: 30}, () => Math.round(row.total_fires / 30 * Math.random())),
          forecast: Array.from({length: 7}, () => Math.round(row.total_fires / 7 * Math.random())),
        });
      }
      
      // Map to Drought Prediction
      if (row.total_droughts > 0) {
        predictions.push({
          district: row.district,
          category: "Drought",
          predicted_complaints_7d: row.total_droughts,
          confidence: 90,
          trend: row.total_droughts > 5 ? "rising" : "stable",
          risk_score: Math.min(100, row.total_droughts * 10),
          historical_avg: Math.round(row.total_droughts / 4 * 10) / 10,
          history: Array.from({length: 30}, () => Math.round(row.total_droughts / 30 * Math.random())),
          forecast: Array.from({length: 7}, () => Math.round(row.total_droughts / 7 * Math.random())),
        });
      }
    });

    return predictions.sort((a, b) => b.risk_score - a.risk_score);
  } catch (error: any) {
    console.error("BigQuery Error:", error.message);
    return [];
  }
}
