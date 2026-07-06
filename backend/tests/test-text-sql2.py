import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

from agent import create_jakarta_pulse_agent

def main():
    agent = create_jakarta_pulse_agent("Mock Context")
    
    print("Testing NLQ Text-to-SQL with SUM...")
    query = "Berapa total jumlah kekeringan dan total karhutla di seluruh provinsi menurut data BigQuery?"
    
    res = agent.run(query)
    print("Result:")
    print(res)

if __name__ == "__main__":
    main()
