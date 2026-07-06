import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

from agent import create_jakarta_pulse_agent, _classify_intent, chart_agent, _get_client

def main():
    agent = create_jakarta_pulse_agent("Mock Context")
    
    print("Testing Chart Agent Intent...")
    query = "Buatkan grafik bar chart dari data 5 provinsi dengan hotspot terbanyak berdasarkan data realtime"
    
    client = _get_client()
    intent = _classify_intent(client, query)
    print("Detected Intent:", intent)
    
    print("Running Agent Flow...")
    res = agent.run(query)
    
    with open("chart-output.txt", "w", encoding="utf-8") as f:
        f.write(res)
    print("Saved result to chart-output.txt")

if __name__ == "__main__":
    main()
