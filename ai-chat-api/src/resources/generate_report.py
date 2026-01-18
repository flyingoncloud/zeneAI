import json
import os
from jinja2 import Template
from drawing_utils import (
    draw_radar_chart, 
    draw_perspective_bar_chart, 
    draw_relational_rating_scale, 
    draw_growth_bar_chart
)

def main():
    # Load data
    with open('report_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Ensure image directory exists
    os.makedirs('extracted_images', exist_ok=True)
    
    # Generate charts using modular utilities
    draw_radar_chart(data, 'extracted_images/radar_chart.png')
    draw_perspective_bar_chart(data, 'extracted_images/perspective_bar_chart.png')
    draw_relational_rating_scale(data, 'extracted_images/relational_rating_scale.png')
    draw_growth_bar_chart(data, 'extracted_images/growth_bar_chart.png')
    
    # Load template
    with open('report_template.md', 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Render report with Jinja2
    template = Template(template_content)
    rendered_report = template.render(data)
    
    # Save final report
    with open('final_report.md', 'w', encoding='utf-8') as f:
        f.write(rendered_report)
    
    print("Report generated successfully: final_report.md")

if __name__ == "__main__":
    main()
