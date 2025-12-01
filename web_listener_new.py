#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram 群组监听器 - 新版网页版
从命令行版本剥离逻辑，整合到Web界面中
"""

import asyncio
import json
import os
import sys
import threading
import time
import argparse
from datetime import datetime
from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from telethon import TelegramClient, events
from db_manager import DatabaseManager
from modules.ai_summarizer.summarizer import Summarizer
from modules.ai_summarizer.deepseek_client import DeepSeekClient

# ==================== 命令行参数解析 ====================
def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description='Telegram 群组监听器 - 新版网页版',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 使用命令行参数启动
  python web_listener_new.py --api-id YOUR_API_ID --api-hash YOUR_API_HASH
  
  # 使用环境变量启动（适合 Docker）
  export API_ID=YOUR_API_ID
  export API_HASH=YOUR_API_HASH
  python web_listener_new.py
        '''
    )
    
    # Telegram API 配置（必需）
    parser.add_argument('--api-id', 
                       dest='api_id',
                       default=os.environ.get('API_ID', ''),
                       help='Telegram API ID (也可通过环境变量 API_ID 设置)')
    parser.add_argument('--api-hash',
                       dest='api_hash',
                       default=os.environ.get('API_HASH', ''),
                       help='Telegram API Hash (也可通过环境变量 API_HASH 设置)')
    # 会话配置
    parser.add_argument('--session-name',
                       dest='session_name',
                       default=os.environ.get('SESSION_NAME', 'mybot1'),
                       help='会话文件名 (默认: mybot1, 也可通过环境变量 SESSION_NAME 设置)')
    parser.add_argument('--config-file',
                       dest='config_file',
                       default=os.environ.get('CONFIG_FILE', 'web_listener_config.json'),
                       help='配置文件路径 (默认: web_listener_config.json)')
    
    # 代理配置
    parser.add_argument('--use-proxy',
                       dest='use_proxy',
                       type=lambda x: x.lower() in ('true', '1', 'yes', 'on'),
                       default=os.environ.get('USE_PROXY', 'true').lower() in ('true', '1', 'yes', 'on'),
                       help='是否使用代理 (默认: true, 也可通过环境变量 USE_PROXY 设置)')
    parser.add_argument('--proxy-type',
                       dest='proxy_type',
                       default=os.environ.get('PROXY_TYPE', 'socks5'),
                       help='代理类型 (默认: socks5, 也可通过环境变量 PROXY_TYPE 设置)')
    parser.add_argument('--proxy-addr',
                       dest='proxy_addr',
                       default=os.environ.get('PROXY_ADDR', 'localhost'),
                       help='代理地址 (默认: localhost, Docker 中可设置为 host.docker.internal, 也可通过环境变量 PROXY_ADDR 设置)')
    parser.add_argument('--proxy-port',
                       dest='proxy_port',
                       type=int,
                       default=int(os.environ.get('PROXY_PORT', '7890')),
                       help='代理端口 (默认: 7890, 也可通过环境变量 PROXY_PORT 设置)')
    
    # Web 服务器配置
    parser.add_argument('--web-host',
                       dest='web_host',
                       default=os.environ.get('WEB_HOST', '127.0.0.1'),
                       help='Web 服务器监听地址 (默认: 127.0.0.1, Docker 中建议设置为 0.0.0.0, 也可通过环境变量 WEB_HOST 设置)')
    parser.add_argument('--web-port',
                       dest='web_port',
                       type=int,
                       default=int(os.environ.get('WEB_PORT', '5001')),
                       help='Web 服务器端口 (默认: 5001, 也可通过环境变量 WEB_PORT 设置)')
    
    # 默认群组（可选）
    parser.add_argument('--default-groups',
                       dest='default_groups',
                       default=os.environ.get('DEFAULT_GROUPS', ''),
                       help='默认监控群组，逗号分隔 (例如: @group1,@group2, 也可通过环境变量 DEFAULT_GROUPS 设置)')
    
    # 消息存储配置
    parser.add_argument('--max-messages-per-group',
                       dest='max_messages_per_group',
                       type=int,
                       default=int(os.environ.get('MAX_MESSAGES_PER_GROUP', '100')),
                       help='每个群组最多保存的消息数 (默认: 100)')
    
    args = parser.parse_args()
    
    # 验证必需配置
    if not args.api_id or not args.api_hash:
        parser.print_help()
        print("\n错误: 必须提供 --api-id 和 --api-hash 参数，或设置环境变量 API_ID 和 API_HASH")
        sys.exit(1)
    
    return args

# 解析命令行参数
args = parse_args()

# ==================== 配置 ====================
# 优先级：命令行参数 > 环境变量 > 默认值
API_ID = args.api_id
API_HASH = args.api_hash
SESSION_NAME = args.session_name
CONFIG_FILE = args.config_file

# 代理配置
USE_PROXY = args.use_proxy
PROXY_CONFIG = {
    'proxy_type': args.proxy_type,
    'addr': args.proxy_addr,
    'port': args.proxy_port,
}

# 默认群组
if args.default_groups:
    DEFAULT_GROUPS = [g.strip() for g in args.default_groups.split(',') if g.strip()]
else:
    DEFAULT_GROUPS = ['@cutepandacalls', '@Xboshi1', '@tradingjournal2025']

# Web 服务器配置
WEB_HOST = args.web_host
WEB_PORT = args.web_port

# 消息存储配置
MAX_MESSAGES_PER_GROUP = args.max_messages_per_group

# ==================== 数据存储 ====================
# 数据库管理器
db_manager = DatabaseManager()

# ==================== AI 总结器 ====================
# 初始化 AI 总结器
summarizer = None
try:
    prompts_config_path = os.path.join('config', 'prompts.json')
    
    # 加载提示词配置
    if os.path.exists(prompts_config_path):
        with open(prompts_config_path, 'r', encoding='utf-8') as f:
            prompts_config = json.load(f)
    else:
        prompts_config = {}
    
    # 尝试加载不同的 AI 配置（按优先级）
    ai_config = None
    provider = 'deepseek'
    
    # 1. 尝试通义千问（推荐，免费额度大）
    tongyi_config_path = os.path.join('config', 'tongyi_config.json')
    if os.path.exists(tongyi_config_path):
        with open(tongyi_config_path, 'r', encoding='utf-8') as f:
            ai_config = json.load(f)
            provider = 'tongyi'
            print("✓ 使用通义千问 API")
    
    # 2. 尝试 Ollama（本地，完全免费）
    elif os.path.exists(os.path.join('config', 'ollama_config.json')):
        ollama_config_path = os.path.join('config', 'ollama_config.json')
        with open(ollama_config_path, 'r', encoding='utf-8') as f:
            ai_config = json.load(f)
            provider = 'ollama'
            print("✓ 使用 Ollama 本地模型")
    
    # 3. 尝试智谱 AI
    elif os.path.exists(os.path.join('config', 'zhipu_config.json')):
        zhipu_config_path = os.path.join('config', 'zhipu_config.json')
        with open(zhipu_config_path, 'r', encoding='utf-8') as f:
            ai_config = json.load(f)
            provider = 'zhipu'
            print("✓ 使用智谱 AI")
    
    # 4. 尝试 DeepSeek（默认）
    elif os.path.exists(os.path.join('config', 'deepseek_config.json')):
        deepseek_config_path = os.path.join('config', 'deepseek_config.json')
        with open(deepseek_config_path, 'r', encoding='utf-8') as f:
            ai_config = json.load(f)
            provider = 'deepseek'
            print("✓ 使用 DeepSeek API")
    
    # 初始化总结器
    if ai_config:
        summarizer = Summarizer(ai_config, prompts_config, provider)
        print(f"✓ AI 总结器已初始化（使用 {provider}）")
    else:
        print("⚠ 未找到任何 AI API 配置文件")
        print("   支持的配置：")
        print("   - config/tongyi_config.json (推荐，免费额度大)")
        print("   - config/ollama_config.json (本地，完全免费)")
        print("   - config/zhipu_config.json")
        print("   - config/deepseek_config.json")
        print("   AI 总结功能将不可用")
        
except Exception as e:
    print(f"⚠ AI 总结器初始化失败: {e}")
    import traceback
    traceback.print_exc()
    summarizer = None

# 当前监控的群组列表
monitored_groups = []
# Telegram客户端连接状态
client_connected = False
# 客户端就绪事件
client_ready_event = threading.Event()
# 客户端事件循环引用（用于线程安全的协程执行）
client_loop_ref = None

# ==================== 配置管理 ====================
def load_config():
    """加载配置文件"""
    global monitored_groups
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                monitored_groups = config.get('groups', DEFAULT_GROUPS.copy())
        except Exception as e:
            print(f"⚠ 加载配置失败: {e}，使用默认配置")
            monitored_groups = DEFAULT_GROUPS.copy()
    else:
        monitored_groups = DEFAULT_GROUPS.copy()
    save_config()

def save_config():
    """保存配置文件"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'groups': monitored_groups,
                'updated_at': datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠ 保存配置失败: {e}")

# 初始化配置
load_config()

# ==================== Telegram客户端 ====================
if USE_PROXY:
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH, proxy=PROXY_CONFIG)
else:
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)

# ==================== 消息处理 ====================
async def message_handler(event):
    """
    处理新消息
    
    Args:
        event: Telethon事件对象
    """
    try:
        # 获取群组信息
        chat = await event.get_chat()
        chat_id = chat.id
        chat_title = getattr(chat, 'title', None) or getattr(chat, 'username', None) or f"ID: {chat_id}"
        chat_username = getattr(chat, 'username', None)
        
        # 确定群组键名（优先使用配置中的名称）
        group_key = None
        if chat_username:
            username_with_at = f"@{chat_username}"
            if username_with_at in monitored_groups:
                group_key = username_with_at
            else:
                # 尝试匹配不带@的
                for group in monitored_groups:
                    if group.startswith('@') and group[1:] == chat_username:
                        group_key = group
                        break
        
        # 如果没找到，使用群组标题
        if not group_key:
            # 尝试通过标题匹配
            for group in monitored_groups:
                try:
                    entity = await client.get_entity(group)
                    if entity.id == chat_id:
                        group_key = group
                        break
                except:
                    pass
            
            # 如果还是没找到，使用标题
            if not group_key:
                group_key = chat_title
        
        # 获取发送者信息
        sender_id = event.message.sender_id
        sender_username = None
        sender_name = None
        
        try:
            sender = await event.message.get_sender()
            if sender:
                sender_username = getattr(sender, 'username', None)
                first_name = getattr(sender, 'first_name', None) or ''
                last_name = getattr(sender, 'last_name', None) or ''
                sender_name = f"{first_name} {last_name}".strip() or None
        except:
            pass
        
        # 构建消息数据（用于数据库存储）
        message_data = {
            'message_id': event.message.id,
            'chat_id': chat_id,
            'chat_title': chat_title,
            'chat_username': chat_username,
            'sender_id': sender_id,
            'sender_username': sender_username,
            'sender_name': sender_name,
            'message_text': event.message.text or '[非文本消息]',
            'message_date': event.message.date if event.message.date else datetime.now()
        }
        
        # 保存到数据库
        db_manager.save_message(message_data)
        
        # 输出日志
        msg_preview = message_data['message_text'][:50] if message_data['message_text'] else '[非文本消息]'
        sender_info = f"@{sender_username}" if sender_username else (sender_name or f"ID:{sender_id}")
        print(f"\n[{chat_title}] [{sender_info}] 收到新消息: {msg_preview}...")
        
    except Exception as e:
        print(f"⚠ 处理消息时出错: {e}")
        import traceback
        traceback.print_exc()

def register_handlers():
    """注册消息处理器"""
    if monitored_groups:
        try:
            client.add_event_handler(message_handler, events.NewMessage(chats=monitored_groups))
            print(f"✓ 已注册 {len(monitored_groups)} 个群组的消息处理器")
        except Exception as e:
            print(f"⚠ 注册处理器失败: {e}")

# ==================== 消息历史管理 ====================
# 消息历史已迁移到数据库，不再使用JSON文件

# ==================== Flask Web服务器 ====================
app = Flask(__name__, template_folder='web/templates', static_folder='web/static')

@app.route('/')
def index():
    """主页面 - 返回HTML文件"""
    return render_template('index.html')

@app.route('/api/groups', methods=['GET'])
def api_get_groups():
    """获取群组列表API"""
    global monitored_groups
    
    try:
        groups_with_info = []
        for group in monitored_groups:
            display_name = group
            message_count = 0
            
            # 尝试从数据库获取群组信息和消息数量
            try:
                if group.startswith('@'):
                    username = group[1:]
                    # 获取最新消息来显示群组名称
                    latest_messages = db_manager.get_messages_by_chat_username(username, limit=1)
                    if latest_messages:
                        display_name = latest_messages[0].get('chat_title', group)
                        # 获取消息总数
                        chat_id = latest_messages[0].get('chat_id')
                        if chat_id:
                            message_count = db_manager.get_message_count_by_chat(chat_id)
            except:
                pass
            
            groups_with_info.append({
                'config_name': group,
                'display_name': display_name,
                'message_count': message_count
            })
        
        return jsonify({
            'success': True,
            'groups': groups_with_info
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'获取群组列表失败: {str(e)}'
        })

@app.route('/api/status', methods=['GET'])
def api_status():
    """获取状态API"""
    try:
        is_connected = client.is_connected()
    except:
        is_connected = False
    
    return jsonify({
        'is_connected': is_connected,
        'groups': monitored_groups
    })

@app.route('/api/groups/<group_name>/messages', methods=['GET'])
def api_get_group_messages(group_name):
    """获取群组消息API"""
    try:
        from urllib.parse import unquote
        group_name = unquote(group_name)
        
        limit = int(request.args.get('limit', 100))
        
        # 处理群组名（去掉@符号）
        if group_name.startswith('@'):
            username = group_name[1:]
        else:
            username = group_name
        
        # 从数据库获取消息
        messages = db_manager.get_messages_by_chat_username(username, limit=limit)
        
        return jsonify({
            'success': True,
            'group': group_name,
            'messages': messages,
            'count': len(messages)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'获取消息失败: {str(e)}'
        })

@app.route('/api/add_group', methods=['POST'])
def api_add_group():
    """添加群组API"""
    try:
        data = request.json
        group = data.get('group', '').strip()
        
        if not group:
            return jsonify({'success': False, 'message': '群组名不能为空'})
        
        # 确保群组名以 @ 开头
        if not group.startswith('@'):
            group = '@' + group
        
        if group in monitored_groups:
            return jsonify({'success': False, 'message': '群组已存在'})
        
        # 验证群组是否存在
        async def verify_group():
            error_detail = None
            try:
                # 直接使用已连接的客户端（连接状态已在上层检查）
                # 尝试获取群组实体
                print(f"[验证] 正在验证群组: {group}")
                entity = await client.get_entity(group)
                
                # 获取群组信息
                chat_title = getattr(entity, 'title', None) or getattr(entity, 'username', None) or f"ID: {entity.id}"
                chat_type = type(entity).__name__
                
                print(f"[验证] ✓ 群组验证成功: {group} ({chat_title}, 类型: {chat_type})")
                return True, None, chat_title
                
            except ValueError as e:
                # 群组不存在或未找到
                error_msg = str(e)
                if 'not found' in error_msg.lower() or 'could not find' in error_msg.lower():
                    error_detail = f'群组不存在: {group}。请检查：\n1. 群组名称是否正确\n2. 是否已加入该群组\n3. 群组是否为公开群组'
                else:
                    error_detail = f'无法找到群组: {error_msg}'
                print(f"[验证] ✗ 群组验证失败 ({group}): {error_detail}")
                return False, error_detail, None
                
            except Exception as e:
                # 其他错误
                error_type = type(e).__name__
                error_msg = str(e)
                
                # 根据错误类型提供更详细的提示
                if 'Username' in error_type or 'username' in error_msg.lower():
                    error_detail = f'群组名称无效: {group}。请确认群组名是否正确（包括大小写）'
                elif 'Forbidden' in error_type or 'forbidden' in error_msg.lower():
                    error_detail = f'无权限访问: {group}。请确认已加入该群组'
                elif 'FloodWait' in error_type:
                    error_detail = f'请求过于频繁，请稍后再试'
                elif 'Timeout' in error_type or 'timeout' in error_msg.lower():
                    error_detail = f'连接超时。请检查网络连接和代理设置'
                else:
                    error_detail = f'验证失败: {error_msg[:100]}'
                
                print(f"[验证] ✗ 群组验证失败 ({group}): {error_type} - {error_detail}")
                return False, error_detail, None
        
        # 验证群组（使用线程安全的方式，通过客户端的事件循环进行验证）
        try:
            # 等待客户端就绪
            if not client_ready_event.wait(timeout=5):
                return jsonify({
                    'success': False, 
                    'message': 'Telegram客户端未连接，请等待连接完成后再试（通常需要10-30秒）'
                })
            
            # 检查客户端是否已连接
            if not client.is_connected():
                return jsonify({
                    'success': False, 
                    'message': 'Telegram客户端未连接，请检查连接状态'
                })
            
            # 使用客户端的事件循环来执行验证（线程安全）
            import concurrent.futures
            
            # 获取客户端的事件循环（在主线程中获取，避免在新线程中访问）
            if client_loop_ref is None or client_loop_ref.is_closed():
                return jsonify({
                    'success': False, 
                    'message': '客户端事件循环不可用，请等待客户端完全启动'
                })
            
            # 将验证协程提交到客户端的事件循环中执行（线程安全）
            future = asyncio.run_coroutine_threadsafe(
                asyncio.wait_for(verify_group(), timeout=15),
                client_loop_ref
            )
            
            try:
                # 等待验证完成（最多20秒）
                is_valid, error_detail, chat_title = future.result(timeout=20)
            except concurrent.futures.TimeoutError:
                return jsonify({
                    'success': False, 
                    'message': f'验证超时: {group}。请检查网络连接和代理设置'
                })
            except Exception as e:
                error_msg = str(e)
                print(f"[验证] 验证过程出错: {error_msg}")
                import traceback
                traceback.print_exc()
                return jsonify({
                    'success': False, 
                    'message': f'验证群组失败: {error_msg[:100]}'
                })
            
            if not is_valid:
                return jsonify({
                    'success': False, 
                    'message': error_detail or f'群组不存在或无法访问: {group}'
                })
        except Exception as e:
            error_msg = str(e)
            print(f"[验证] 验证过程出错: {error_msg}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False, 
                'message': f'验证群组失败: {error_msg[:100]}'
            })
        
        # 添加到监控列表
        monitored_groups.append(group)
        save_config()
        
        # 如果客户端已连接，重新注册处理器
        if client.is_connected():
            register_handlers()
        
        success_msg = f'添加成功！群组: {group}'
        if chat_title:
            success_msg += f' ({chat_title})'
        
        return jsonify({'success': True, 'message': success_msg})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'添加群组时出错: {str(e)}'})

@app.route('/api/remove_group', methods=['POST'])
def api_remove_group():
    """删除群组API"""
    try:
        data = request.json
        group = data.get('group', '').strip()
        
        if group not in monitored_groups:
            return jsonify({'success': False, 'message': '群组不存在'})
        
        monitored_groups.remove(group)
        save_config()
        
        # 如果客户端已连接，重新注册处理器
        if client.is_connected():
            register_handlers()
        
        return jsonify({'success': True, 'message': '删除成功！'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/groups/<group_name>/summarize', methods=['POST'])
def api_summarize_group(group_name):
    """总结群组消息API"""
    try:
        from urllib.parse import unquote
        group_name = unquote(group_name)
        
        if not summarizer:
            return jsonify({
                'success': False,
                'message': 'AI 总结功能未配置，请检查 DeepSeek API 配置'
            })
        
        data = request.json or {}
        days = data.get('days')  # 最近N天，None表示全部
        limit = data.get('limit', 200)  # 最多使用多少条消息进行总结
        
        # 处理群组名
        if group_name.startswith('@'):
            username = group_name[1:]
        else:
            username = group_name
        
        # 获取消息
        messages = db_manager.get_messages_by_chat_username(username, limit=limit * 2)  # 多取一些，后面会过滤
        
        if not messages:
            return jsonify({
                'success': False,
                'message': '该群组暂无消息'
            })
        
        # 获取群组信息
        chat_title = messages[0].get('chat_title', group_name)
        
        # 如果指定了天数，过滤消息
        if days:
            from datetime import timedelta, timezone
            # 使用 UTC 时区创建 cutoff_date，确保是 offset-aware
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            filtered_messages = []
            for msg in messages:
                msg_date = msg.get('message_date', '')
                if isinstance(msg_date, str):
                    try:
                        # 尝试解析日期字符串
                        if 'Z' in msg_date or '+' in msg_date or msg_date.count('-') > 2:
                            # 有时区信息
                            msg_date_obj = datetime.fromisoformat(msg_date.replace('Z', '+00:00'))
                        else:
                            # 没有时区信息，假设是 UTC
                            msg_date_obj = datetime.fromisoformat(msg_date).replace(tzinfo=timezone.utc)
                    except:
                        continue
                else:
                    # 如果是 datetime 对象
                    msg_date_obj = msg_date
                    # 如果没有时区信息，添加 UTC 时区
                    if msg_date_obj.tzinfo is None:
                        msg_date_obj = msg_date_obj.replace(tzinfo=timezone.utc)
                
                # 确保 cutoff_date 和 msg_date_obj 都是 offset-aware
                if cutoff_date.tzinfo is None:
                    cutoff_date = cutoff_date.replace(tzinfo=timezone.utc)
                if msg_date_obj.tzinfo is None:
                    msg_date_obj = msg_date_obj.replace(tzinfo=timezone.utc)
                
                if msg_date_obj >= cutoff_date:
                    filtered_messages.append(msg)
            
            messages = filtered_messages[:limit]  # 限制数量
        
        if not messages:
            return jsonify({
                'success': False,
                'message': f'最近 {days} 天内该群组无消息'
            })
        
        # 格式化消息用于总结
        formatted_messages = []
        for msg in messages:
            sender = msg.get('sender_username') or msg.get('sender_name') or f"ID:{msg.get('sender_id')}"
            text = msg.get('message_text', '[非文本消息]')
            date = msg.get('message_date', '')
            formatted_messages.append({
                'date': date,
                'sender': sender,
                'text': text
            })
        
        # 调用总结器
        prompt_config = summarizer.prompts.get('group_summary', {})
        user_template = prompt_config.get('user_template', '请总结以下内容：\n\n{content}')
        system_prompt = prompt_config.get('system', '你是一个专业的总结助手。')
        max_tokens = prompt_config.get('max_tokens', 3000)
        
        # 格式化消息内容
        content_lines = []
        for msg in formatted_messages:
            date_str = msg['date'][:10] if msg['date'] else ''  # 只取日期部分
            content_lines.append(f"[{date_str}] {msg['sender']}: {msg['text']}")
        content = '\n'.join(content_lines)
        
        # 格式化提示词
        user_prompt = user_template.format(group_name=chat_title, content=content)
        
        # 检查是否使用流式（默认使用流式）
        use_stream = request.json.get('stream', True) if request.json else True
        
        if use_stream and hasattr(summarizer.client, 'chat_stream'):
            # 流式模式
            def generate():
                # 发送初始信息
                yield f"data: {json.dumps({'type': 'start', 'group': chat_title, 'message_count': len(messages)}, ensure_ascii=False)}\n\n"
                
                # 调用流式总结
                full_summary = ""
                try:
                    # 调用总结器
                    prompt_config = summarizer.prompts.get('group_summary', {})
                    user_template = prompt_config.get('user_template', '请总结以下内容：\n\n{content}')
                    system_prompt = prompt_config.get('system', '你是一个专业的总结助手。')
                    max_tokens = prompt_config.get('max_tokens', 3000)
                    
                    # 格式化消息内容
                    content_lines = []
                    for msg in formatted_messages:
                        date_str = msg['date'][:10] if msg['date'] else ''
                        content_lines.append(f"[{date_str}] {msg['sender']}: {msg['text']}")
                    content = '\n'.join(content_lines)
                    
                    # 格式化提示词
                    user_prompt = user_template.format(group_name=chat_title, content=content)
                    
                    # 构建消息
                    messages_api = [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_prompt}
                    ]
                    
                    # 流式调用
                    for chunk in summarizer.client.chat_stream(messages_api, max_tokens=max_tokens):
                        if chunk:
                            full_summary += chunk
                            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"
                    
                    # 计算时间范围
                    if messages:
                        first_msg_date = messages[-1].get('message_date', '')
                        last_msg_date = messages[0].get('message_date', '')
                    else:
                        first_msg_date = ''
                        last_msg_date = ''
                    
                    # 发送完成信息
                    yield f"data: {json.dumps({'type': 'done', 'summary': full_summary, 'message_count': len(messages), 'date_range': {'start': first_msg_date[:10] if first_msg_date else '', 'end': last_msg_date[:10] if last_msg_date else ''}, 'days': days}, ensure_ascii=False)}\n\n"
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
            
            return Response(stream_with_context(generate()), mimetype='text/event-stream')
        else:
            # 非流式模式（兼容旧版本）
            # 调用 AI
            messages_api = [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ]
            
            summary = summarizer.client.chat(messages_api, max_tokens=max_tokens)
            
            if not summary:
                return jsonify({
                    'success': False,
                    'message': 'AI 总结生成失败，请检查 API 配置'
                })
            
            # 计算时间范围
            if messages:
                first_msg_date = messages[-1].get('message_date', '')
                last_msg_date = messages[0].get('message_date', '')
            else:
                first_msg_date = ''
                last_msg_date = ''
            
            return jsonify({
                'success': True,
                'group': chat_title,
                'group_name': group_name,
                'summary': summary,
                'message_count': len(messages),
                'date_range': {
                    'start': first_msg_date[:10] if first_msg_date else '',
                    'end': last_msg_date[:10] if last_msg_date else ''
                },
                'days': days
            })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'总结失败: {str(e)}'
        })


# ==================== Telegram客户端运行 ====================
def run_telegram_client():
    """在后台线程运行Telegram客户端"""
    async def main():
        global client_connected, client_loop_ref
        
        try:
            print("正在连接Telegram...")
            print(f"   API_ID: {API_ID[:10]}...")
            if USE_PROXY:
                print(f"   使用代理: {PROXY_CONFIG['proxy_type']}://{PROXY_CONFIG['addr']}:{PROXY_CONFIG['port']}")
            else:
                print("   不使用代理")
            sys.stdout.flush()
            
            # 添加超时处理
            try:
                await asyncio.wait_for(client.start(), timeout=30)
                print("✓ Telegram客户端已连接")
                me = await client.get_me()
                print(f"   已登录为: {me.first_name or '用户'}")
                sys.stdout.flush()
                
                # 保存事件循环引用（用于线程安全的协程执行）
                client_loop_ref = asyncio.get_event_loop()
                
                client_connected = True
                client_ready_event.set()
                
                # 自动注册消息处理器并开始监听
                if monitored_groups:
                    try:
                        client.add_event_handler(message_handler, events.NewMessage(chats=monitored_groups))
                        print(f"✓ 已自动注册 {len(monitored_groups)} 个群组的消息处理器，开始监听...")
                        sys.stdout.flush()
                    except Exception as e:
                        print(f"⚠ 自动注册处理器失败: {e}")
                        sys.stdout.flush()
                
                # 持续运行
                await client.run_until_disconnected()
            except asyncio.TimeoutError:
                print("✗ Telegram客户端连接超时（30秒）")
                print("   请检查：")
                print("   1. ClashX 代理是否运行在 7890 端口")
                print("   2. 网络连接是否正常")
                print("   3. Telegram 服务是否可用")
                sys.stdout.flush()
                client_connected = False
                client_ready_event.clear()
            except Exception as e:
                print(f"✗ Telegram客户端连接失败: {e}")
                import traceback
                traceback.print_exc()
                sys.stdout.flush()
                client_connected = False
                client_ready_event.clear()
        except Exception as e:
            print(f"✗ Telegram客户端初始化失败: {e}")
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            client_connected = False
            client_ready_event.clear()
    
    try:
        print("[线程] 启动Telegram客户端线程...")
        sys.stdout.flush()
        
        # 在新线程中创建新的事件循环
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(main())
        finally:
            try:
                loop.run_until_complete(client.disconnect())
            except:
                pass
            loop.close()
    except KeyboardInterrupt:
        print("[线程] Telegram客户端线程被中断")
        client_ready_event.clear()
        sys.stdout.flush()
    except Exception as e:
        print(f"✗ Telegram客户端运行错误: {e}")
        import traceback
        traceback.print_exc()
        client_ready_event.clear()
        sys.stdout.flush()

# ==================== 启动 ====================
if __name__ == "__main__":
    print("="*60)
    print("Telegram 群组监听器 - 新版网页版")
    print("="*60)
    print(f"\n正在监控 {len(monitored_groups)} 个群组:")
    for i, group in enumerate(monitored_groups, 1):
        print(f"  {i}. {group}")
    
    # 在后台线程启动Telegram客户端
    print("\n启动Telegram客户端线程...")
    sys.stdout.flush()
    telegram_thread = threading.Thread(target=run_telegram_client, daemon=True)
    telegram_thread.start()
    
    # 等待一下让线程启动
    time.sleep(0.5)
    sys.stdout.flush()
    
    # 等待客户端连接（最多等待10秒）
    print("等待Telegram客户端连接...")
    sys.stdout.flush()
    if client_ready_event.wait(timeout=10):
        print("✓ Telegram客户端已就绪")
        sys.stdout.flush()
    else:
        print("⚠ Telegram客户端连接超时（10秒），但程序会继续运行")
        print("   客户端连接成功后会自动开始监听")
        sys.stdout.flush()
    
    print("\n" + "="*60)
    print("Web服务器启动中...")
    print(f"访问地址: http://{WEB_HOST}:{WEB_PORT}")
    print("="*60 + "\n")
    
    # 启动Flask服务器
    try:
        app.run(host=WEB_HOST, port=WEB_PORT, debug=False, use_reloader=False, threaded=True)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n错误: 端口 {WEB_PORT} 已被占用")
            print("请关闭占用端口的程序，或使用 --web-port 参数指定其他端口")
        else:
            print(f"\n错误: {e}")

