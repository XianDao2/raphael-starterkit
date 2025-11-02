import { NextResponse } from 'next/server';

// 定义请求和响应类型
interface PronunciationRequest {
  type: 'cn' | 'en';
  value: string;
}

interface PronunciationResponse {
  chinese: string;
  pinyin: string;
  chineseIpa: string;
  matchedWords: string[];
  englishPhonetic: string;
  pronunciationNote: string;
  translation?: string;
  example: {
    chinese: string;
    english: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: PronunciationRequest = await request.json();
    const { type, value } = body;

    // 验证请求参数
    if (!type || !value || !['cn', 'en'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // 调用大模型API，这里使用OpenAI API
    // 注意：实际使用时需要配置正确的API密钥和端点
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4', // 或使用GLM-4.1V-9B-Thinking模型
        messages: [
          {
            role: 'system',
            content: `你是一个中英文发音匹配专家。根据输入的中文或英文文本，生成对应的发音匹配数据，包括：
            - 中文词语
            - 拼音
            - 国际音标(IPA)
            - 发音近似的英文词语列表
            - 英文发音的国际音标
            - 发音说明
            - 例句(中文和英文)
            如果输入是英文，还需要提供对应的中文翻译。
            请以JSON格式返回，确保包含以下字段：
            chinese, pinyin, chineseIpa, matchedWords, englishPhonetic, pronunciationNote, example
            example包含chinese和english两个字段。
            如果输入是英文，还需要包含translation字段。`,
          },
          {
            role: 'user',
            content: type === 'cn' 
              ? `请提供中文词语「${value}」的发音匹配数据，包括对应的英文发音近似词。`
              : `请提供英文词语「${value}」的发音匹配数据，包括对应的中文翻译和发音近似词。`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
    }

    const data = await openaiResponse.json();
    const result: PronunciationResponse = JSON.parse(data.choices[0].message.content);

    // 验证返回的数据结构
    if (!result.chinese || !result.pinyin || !result.matchedWords || !result.example) {
      throw new Error('Invalid response structure from AI API');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing pronunciation request:', error);
    return NextResponse.json(
      { error: 'Failed to process pronunciation request', details: (error as Error).message },
      { status: 500 }
    );
  }
}